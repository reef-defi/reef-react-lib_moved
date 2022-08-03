import { BigNumber } from 'ethers';
import { Dispatch, useEffect } from 'react';
import Uik from '@reef-defi/ui-kit';
import { approveTokenAmount, getReefswapRouter } from '../rpc';
import {
  AddressToNumber,
  ensureTokenAmount,
  Network,
  NotifyFun,
  Pool,
  ReefSigner,
  resolveSettings, Token,
  TokenWithAmount,
} from '../state';
import { SwapAction } from '../store';
import {
  clearTokenAmountsAction, setCompleteStatusAction, setLoadingAction, setPoolAction, setStatusAction, setToken1Action, setToken2Action,
} from '../store/actions/defaultActions';
import { SwapState } from '../store/reducers/swap';
import {
  ButtonStatus,
  calculateAmount,
  calculateAmountWithPercentage,
  calculateDeadline,
  convert2Normal,
  ensure,
} from '../utils';
import { useKeepTokenUpdated } from './useKeepTokenUpdated';
import { useLoadPool } from './useLoadPool';

const swapStatus = (
  sell: TokenWithAmount,
  buy: TokenWithAmount,
  isEvmClaimed?: boolean,
  pool?: Pool,
): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind account');
    ensure(!sell.isEmpty, 'Select sell token');
    ensure(!buy.isEmpty, 'Select buy token');
    ensure(buy.address !== sell.address, 'Tokens must be different');
    ensure(!!pool, 'Pool does not exist');
    ensure(sell.amount.length !== 0, `Missing ${sell.symbol} amount`);
    ensure(buy.amount.length !== 0, `Missing ${buy.symbol} amount`);
    ensure(parseFloat(sell.amount) > 0, `Missing ${sell.symbol} amount`);
    ensure(
      parseFloat(sell.amount)
        <= convert2Normal(sell.decimals, sell.balance.toString()),
      `Insufficient ${sell.symbol} balance`,
    );

    // Because of aboves ensure pool would not need explenation mark. Typescript broken...
    const { reserve1, reserve2 } = pool!;
    const amountOut1 = BigNumber.from(calculateAmount(sell));
    const amountOut2 = BigNumber.from(calculateAmount(buy));
    const reserved1 = BigNumber.from(reserve1).sub(amountOut1);
    const reserved2 = BigNumber.from(reserve2).sub(amountOut2);

    ensure(reserved1.gt(0) || reserved2.gt(0), 'Insufficient amounts');

    // WIP checking for ReefswapV2: K error
    // Temporary solution was with `swapExactTokensForTokensSupportingFeeOnTransferTokens` function!
    // Error still arives when using `swapExactTokensForTokens`

    // const balanceAdjuster1 = token1.balance.mul(1000).sub(amountIn1.mul(3));
    // const balanceAdjuster2 = token2.balance.mul(1000).sub(amountIn2.mul(3));

    // const reserved = reserved1.mul(reserved2).mul(1000 ** 2);
    // const balance = balanceAdjuster1.mul(balanceAdjuster2);
    // ensure(balance.gte(reserved), 'Deliquified pool');
    // ensure(amountOut1.eq(amountIn1) && amountOut2.eq(amountIn2), 'Deliquified pool')
    return { isValid: true, text: 'Trade' };
  } catch (e) {
    return { isValid: false, text: e.message };
  }
};

interface UseSwapState {
  address1: string;
  address2: string;
  state: SwapState;
  tokens: Token[];
  network?: Network;
  account?: ReefSigner;
  tokenPrices: AddressToNumber<number>;
  dispatch: Dispatch<SwapAction>;
}
export const useSwapState = ({
  state,
  tokens,
  account,
  network,
  address1,
  address2,
  tokenPrices,
  dispatch,
}: UseSwapState): void => {
  const {
    token2: buy, token1: sell, pool, isLoading, isValid,
  } = state;
  const setBuy = (token: TokenWithAmount): void => dispatch(setToken2Action(token));
  const setSell = (token: TokenWithAmount): void => dispatch(setToken1Action(token));

  // Updating swap pool
  const [loadedPool, isPoolLoading] = useLoadPool(
    sell,
    buy,
    network?.factoryAddress || '',
    account?.signer,
  );
  useEffect(() => {
    if (loadedPool) {
      dispatch(setPoolAction(loadedPool));
    }
  }, [loadedPool]);

  // Updating swap tokens
  useKeepTokenUpdated(address2, buy, tokens, tokenPrices, setBuy);
  useKeepTokenUpdated(address1, sell, tokens, tokenPrices, setSell);

  // Updating swap state
  useEffect(() => {
    let [currentStatus, currentIsValid, currentIsLoading] = [
      '',
      isValid,
      isLoading,
    ];
    if (isPoolLoading) {
      currentStatus = 'Loading pool';
      currentIsLoading = true;
    } else {
      const { isValid, text } = swapStatus(
        sell,
        buy,
        account?.isEvmClaimed,
        pool,
      );
      currentStatus = text;
      currentIsValid = isValid;
      currentIsLoading = false;
    }
    dispatch(
      setCompleteStatusAction(currentStatus, currentIsValid, currentIsLoading),
    );
  }, [sell.amount, buy.amount, account?.isEvmClaimed, pool, isPoolLoading]);
};

interface OnSwap {
  state: SwapState;
  network?: Network;
  account?: ReefSigner;
  notify: NotifyFun;
  dispatch: Dispatch<SwapAction>;
  updateTokenState: () => Promise<void>;
}

export const onSwap = ({
  state, network, account, dispatch, updateTokenState,
}: OnSwap) => async (): Promise<void> => {
  const {
    token1, settings, token2, isValid, isLoading,
  } = state;
  if (!isValid || isLoading || !account || !network) {
    return;
  }
  const { signer, evmAddress } = account;
  const { percentage, deadline } = resolveSettings(settings);

  try {
    dispatch(setLoadingAction(true));
    ensureTokenAmount(token1);

    dispatch(setStatusAction(`Approving ${token1.name} token`));
    const sellAmount = calculateAmount(token1);
    const minBuyAmount = calculateAmountWithPercentage(token2, percentage);
    const reefswapRouter = getReefswapRouter(network.routerAddress, signer);
    await approveTokenAmount(token1, network.routerAddress, signer);

    dispatch(setStatusAction('Executing swap'));
    await reefswapRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      sellAmount,
      minBuyAmount,
      [token1.address, token2.address],
      evmAddress,
      calculateDeadline(deadline),
    );

    Uik.notify.success({
      message: 'Trade complete.\nBalances will reload after blocks are finalized',
      keepAlive: true,
    });

    Uik.dropConfetti();
  } catch (error) {
    Uik.notify.danger({
      message: `An error occurred while trying to complete your trade: ${error.message}`,
      keepAlive: true,
    });
  } finally {
    await updateTokenState().catch(() => Uik.notify.danger({
      message: 'Please reaload the page to update token balances',
      keepAlive: true,
    }));

    dispatch(setLoadingAction(false));
    dispatch(clearTokenAmountsAction());
  }
};
