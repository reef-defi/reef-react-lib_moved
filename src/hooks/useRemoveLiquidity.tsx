import Uik from '@reef-chain/ui-kit';
import BN from 'bignumber.js';
import { BigNumber, Contract } from 'ethers';
import React, { Dispatch, useEffect } from 'react';
import { ReefswapPair } from '../assets/abi/ReefswapPair';
import { getReefswapRouter } from '../rpc';
import {
  AddressToNumber,
  Network, NotifyFun, Pool, ReefSigner, REMOVE_DEFAULT_SLIPPAGE_TOLERANCE, resolveSettings, Token,
} from '../state';
import {
  RemoveLiquidityActions, RemoveLiquidityState, setCompleteStatusAction, setLoadingAction, setPercentageAction, setPoolAction, setStatusAction, setToken1Action, setToken2Action,
} from '../store';
import {
  ButtonStatus, calculateDeadline, captureError, ensure, errorHandler,
} from '../utils';
import { useKeepTokenUpdated } from './useKeepTokenUpdated';
import { useLoadPool } from './useLoadPool';
import { ApolloClient } from '@apollo/client';

interface OnRemoveLiquidity {
  network?: Network;
  signer?: ReefSigner;
  batchTxs?: boolean;
  state: RemoveLiquidityState;
  dispatch: Dispatch<RemoveLiquidityActions>;
  notify: NotifyFun;
  onSuccess?: (...args: any[]) => any;
  onFinalized?: (...args: any[]) => any;
}

interface UseRemoveLiquidity {
  address1: string;
  address2: string;
  tokens: Token[];
  tokenPrices: AddressToNumber<number>;
  dexClient?: ApolloClient<any>;
  signer?: ReefSigner;
  batchTxs?: boolean;
  state: RemoveLiquidityState;
  dispatch: Dispatch<RemoveLiquidityActions>;
}

const removeStatus = (percentageAmount: number, pool?: Pool): ButtonStatus => {
  try {
    ensure(!!pool, 'Invalid Pair');
    ensure(pool?.userPoolBalance !== '0', 'Insufficient pool balance');
    ensure(percentageAmount > 0, 'Enter an amount');
    return {
      isValid: true,
      text: 'Unstake',
    };
  } catch (e) {
    return {
      isValid: false,
      text: e.message,
    };
  }
};

export const useRemoveLiquidity = ({
  address1,
  address2,
  state,
  signer,
  dexClient,
  tokens,
  tokenPrices,
  dispatch,
}: UseRemoveLiquidity): void => {
  const {
    percentage, token1, token2, pool, isLoading, isValid, status,
  } = state;
  // Updating tokens
  useKeepTokenUpdated(address1, token1, tokens, tokenPrices, (token) => dispatch(setToken1Action(token)));
  useKeepTokenUpdated(address2, token2, tokens, tokenPrices, (token) => dispatch(setToken2Action(token)));

  // Find pool
  const [loadedPool, isPoolLoading] = useLoadPool(
    token1,
    token2,
    signer?.address || '',
    dexClient,
    isLoading,
  );
  // Updating pool
  useEffect(() => {
    if (loadedPool) {
      dispatch(setPoolAction(loadedPool));
    }
  }, [loadedPool]);

  // Updating status
  useEffect(() => {
    let [currentStatus, currentIsValid, currentIsLoading] = [
      status,
      isValid,
      isLoading,
    ];
    if (isPoolLoading) {
      currentIsLoading = true;
      currentStatus = 'Loading pool';
    } else {
      const res = removeStatus(percentage, pool);
      currentStatus = res.text;
      currentIsValid = res.isValid;
      currentIsLoading = false;
    }
    dispatch(setCompleteStatusAction(currentStatus, currentIsValid, currentIsLoading));
  }, [percentage, pool, isPoolLoading]);
};

export const onRemoveLiquidity = ({
  state,
  dispatch,
  network,
  signer: sig,
  batchTxs,
  onSuccess,
  onFinalized,
}: OnRemoveLiquidity) => async (): Promise<void> => {
  const { pool, percentage: percentageAmount, settings } = state;
  if (!pool || !sig || !network || percentageAmount === 0) { return; }
  const { signer, evmAddress, address } = sig;
  const { percentage, deadline } = resolveSettings(
    settings,
    REMOVE_DEFAULT_SLIPPAGE_TOLERANCE,
  );

  const reefswapRouter = getReefswapRouter(
    network.routerAddress,
    signer,
  );
  const userPoolBalance = new BN(pool.userPoolBalance);
  const poolPercentage = userPoolBalance.div(pool.totalSupply);
  const removedLiquidity = userPoolBalance
    .multipliedBy(percentageAmount)
    .div(100)
    .toFixed(0);

  const minimumTokenAmount1 = new BN(pool.reserve1)
    .multipliedBy(poolPercentage)
    .multipliedBy(percentageAmount)
    .div(100)
    .multipliedBy(100 - percentage)
    .div(100)
    .toFixed(0);

  const minimumTokenAmount2 = new BN(pool.reserve2)
    .multipliedBy(poolPercentage)
    .multipliedBy(percentageAmount)
    .div(100)
    .multipliedBy(100 - percentage)
    .div(100)
    .toFixed(0);

  try {
    dispatch(setLoadingAction(true));
    dispatch(setStatusAction('Withdrawing'));
    const poolContract = new Contract(pool.poolAddress, ReefswapPair, signer);

    const approveTransaction = await poolContract.populateTransaction.approve(network.routerAddress, removedLiquidity);
    const withdrawTransaction = await reefswapRouter.populateTransaction.removeLiquidity(
      pool.token1.address,
      pool.token2.address,
      removedLiquidity,
      minimumTokenAmount1,
      minimumTokenAmount2,
      evmAddress,
      calculateDeadline(deadline),
    );
    const approveResources = await signer.provider.estimateResources(approveTransaction);

    const approveExtrinsic = signer.provider.api.tx.evm.call(
      approveTransaction.to,
      approveTransaction.data,
      BigNumber.from(approveTransaction.value || 0),
      approveResources.gas,
      approveResources.storage.lt(0) ? BigNumber.from(0) : approveResources.storage,
    );

    if (batchTxs) {
      const withdrawExtrinsic = signer.provider.api.tx.evm.call(
        withdrawTransaction.to,
        withdrawTransaction.data,
        BigNumber.from(withdrawTransaction.value || 0),
        BigNumber.from(626914).mul(2), // hardcoded gas estimation, multiply by 2 as a safety margin
        BigNumber.from(64).mul(2), // hardcoded storage estimation, multiply by 2 as a safety margin
      );

      // Batching extrinsics
      const batch = signer.provider.api.tx.utility.batchAll([
        approveExtrinsic,
        withdrawExtrinsic,
      ]);

      // Signing and awaiting when data comes in block
      const signAndSend = new Promise<void>(async (resolve, reject) => {
        batch.signAndSend(
          address,
          { signer: signer.signingKey },
          (status: any) => {
            const err = captureError(status.events);
            if (err) {
              reject({ message: err });
            }
            if (status.dispatchError) {
              reject({ message: status.dispatchError.toString() });
            }
            if (status.status.isInBlock) {
              resolve();
            }
            // If you want to await until block is finalized use below if
            if (status.status.isFinalized) {
              if (onFinalized) onFinalized();

              Uik.notify.success({
                message: 'Blocks have been finalized',
                keepAlive: true,
              });
            }
          },
        );
      });
      await signAndSend;
    } else {
      // Approve token
      const signAndSendApprove = new Promise<void>(async (resolve, reject) => {
        approveExtrinsic.signAndSend(
          address,
          { signer: signer.signingKey },
          (status: any) => {
            const err = captureError(status.events);
            if (err) {
              reject({ message: err });
            }
            if (status.dispatchError) {
              reject({ message: status.dispatchError.toString() });
            }
            if (status.status.isInBlock) {
              resolve();
            }
          },
        );
      });
      await signAndSendApprove;

      // Withdraw liquidity
      const withdrawResources = await signer.provider.estimateResources(withdrawTransaction);
      const withdrawExtrinsic = signer.provider.api.tx.evm.call(
        withdrawTransaction.to,
        withdrawTransaction.data,
        BigNumber.from(withdrawTransaction.value || 0),
        withdrawResources.gas,
        withdrawResources.storage.lt(0) ? BigNumber.from(0) : withdrawResources.storage,
      );
      const signAndSendWithdraw = new Promise<void>(async (resolve, reject) => {
        withdrawExtrinsic.signAndSend(
          address,
          { signer: signer.signingKey },
          (status: any) => {
            const err = captureError(status.events);
            if (err) {
              reject({ message: err });
            }
            if (status.dispatchError) {
              console.error(status.dispatchError.toString());
              reject({ message: status.dispatchError.toString() });
            }
            if (status.status.isInBlock) {
              resolve();
            }
            // If you want to await until block is finalized use below if
            if (status.status.isFinalized) {
              if (onFinalized) onFinalized();

              Uik.notify.success({
                message: 'Blocks have been finalized',
                keepAlive: true,
              });
            }
          },
        );
      });
      await signAndSendWithdraw;
    }

    if (onSuccess) onSuccess();

    Uik.notify.success({
      message: 'Tokens were successfully withdrawn.\nBalances will reload after blocks are finalized.',
      keepAlive: true,
    });

    Uik.dropConfetti();
  } catch (e) {
    Uik.prompt({
      type: 'danger',
      title: 'Transaction has failed',
      message: `An error occurred while trying to withdraw tokens: ${errorHandler(e.message)}\nYour assets remain unchanged.`,
      actions: <Uik.Button text="Close" danger />,
    });
  } finally {
    dispatch(setLoadingAction(false));
    dispatch(setPercentageAction(0));
  }
};
