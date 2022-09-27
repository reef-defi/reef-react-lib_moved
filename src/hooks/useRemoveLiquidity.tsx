import Uik from '@reef-defi/ui-kit';
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

interface DefaultVariables {
  network?: Network;
  signer?: ReefSigner;
  state: RemoveLiquidityState;
  dispatch: Dispatch<RemoveLiquidityActions>;
}
interface OnRemoveLiquidity extends DefaultVariables {
  notify: NotifyFun;
  onSuccess?: (...args: any[]) => any;
  onFinalized?: (...args: any[]) => any;
}

interface UseRemoveLiquidity extends DefaultVariables {
  address1: string;
  address2: string;
  tokens: Token[];
  tokenPrices: AddressToNumber<number>;
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
  network,
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
    network?.factoryAddress || '',
    signer?.signer,
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
    const withdrawExtrinsic = signer.provider.api.tx.evm.call(
      withdrawTransaction.to,
      withdrawTransaction.data,
      BigNumber.from(withdrawTransaction.value || 0),
      BigNumber.from(626914).mul(2),
      BigNumber.from(0),
    );

    const batch = signer.provider.api.tx.utility.batchAll([
      approveExtrinsic,
      withdrawExtrinsic,
    ]);

    const signAndSend = new Promise<void>(async (resolve, reject) => {
      batch.signAndSend(
        address,
        { signer: signer.signingKey },
        (status: any) => {
          console.log('Unstake status: ', status);
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
