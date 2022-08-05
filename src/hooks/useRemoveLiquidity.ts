import Uik from '@reef-defi/ui-kit';
import BigNumber from 'bignumber.js';
import { Dispatch, useEffect } from 'react';
import { approveAmount, getReefswapRouter } from '../rpc';
import {
  AddressToNumber,
  Network, NotifyFun, Pool, ReefSigner, REMOVE_DEFAULT_SLIPPAGE_TOLERANCE, resolveSettings, Token
} from '../state';
import {
  RemoveLiquidityActions, RemoveLiquidityState, setCompleteStatusAction, setLoadingAction, setPercentageAction, setPoolAction, setStatusAction, setToken1Action, setToken2Action
} from '../store';
import {
  ButtonStatus, calculateDeadline, ensure, errorHandler
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
      text: 'Withdraw',
    };
  } catch (e) {
    return {
      isValid: false,
      text: e.message,
    };
  }
};

export const useRemoveLiquidity = ({
  address1, address2, state, signer, network, tokens, tokenPrices, dispatch,
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
    isLoading
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
  signer,
}: OnRemoveLiquidity) => async (): Promise<void> => {
  const { pool, percentage: percentageAmount, settings } = state;
  if (!pool || !signer || !network || percentageAmount === 0) { return; }

  const { percentage, deadline } = resolveSettings(
    settings,
    REMOVE_DEFAULT_SLIPPAGE_TOLERANCE,
  );

  const reefswapRouter = getReefswapRouter(
    network.routerAddress,
    signer.signer,
  );
  const userPoolBalance = new BigNumber(pool.userPoolBalance);
  const poolPercentage = userPoolBalance.div(pool.totalSupply);
  const removedLiquidity = userPoolBalance
    .multipliedBy(percentageAmount)
    .div(100)
    .toFixed(0);

  const minimumTokenAmount1 = new BigNumber(pool.reserve1)
    .multipliedBy(poolPercentage)
    .multipliedBy(percentageAmount)
    .div(100)
    .multipliedBy(100-percentage)
    .div(100)
    .toFixed(0);

  const minimumTokenAmount2 = new BigNumber(pool.reserve2)
    .multipliedBy(poolPercentage)
    .multipliedBy(percentageAmount)
    .div(100)
    .multipliedBy(100-percentage)
    .div(100)
    .toFixed(0);

  try {
    dispatch(setLoadingAction(true));
    dispatch(setStatusAction('Approving remove'));
    await approveAmount(
      pool.poolAddress,
      network.routerAddress,
      removedLiquidity,
      signer.signer,
    );

    console.log('Estimating withdraw limits')
    let extrinsicTransaction = await reefswapRouter.populateTransaction.removeLiquidity(
      pool.token1.address,
      pool.token2.address,
      removedLiquidity,
      minimumTokenAmount1,
      minimumTokenAmount2,
      signer.evmAddress,
      calculateDeadline(deadline),
    );
    let estimation = await signer.signer.provider.estimateResources(extrinsicTransaction);
    console.log(`Withdraw call estimations: \n\tGas: ${estimation.gas.toString()}\n\tStorage: ${estimation.storage.toString()}\n\tWeight fee: ${estimation.weightFee.toString()}`)

    dispatch(setStatusAction('Withdrawing'));
    await reefswapRouter.removeLiquidity(
      pool.token1.address,
      pool.token2.address,
      removedLiquidity,
      minimumTokenAmount1,
      minimumTokenAmount2,
      signer.evmAddress,
      calculateDeadline(deadline),
      {
        gasLimit: estimation.gas,
        customData: {
          storageLimit: estimation.storage.lt(0) ? 0 : estimation.storage
        }
      }
    );

    Uik.notify.success({
      message: 'Tokens were successfully withdrawn.\nBalances will reload after blocks are finalized.',
      keepAlive: true,
    });

    Uik.dropConfetti();
  } catch (e) {
    Uik.notify.danger({
      message: `An error occurred while trying to withdraw tokens: ${errorHandler(e.message)}`,
      keepAlive: true,
    });
  } finally {
    dispatch(setLoadingAction(false));
    dispatch(setPercentageAction(0));
  }
};
