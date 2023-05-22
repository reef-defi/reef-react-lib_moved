import Uik from '@reef-chain/ui-kit';
import { BigNumber, Contract } from 'ethers';
import { Dispatch, useEffect, useRef } from 'react';
import { ERC20 } from '../assets/abi/ERC20';
import { getReefswapRouter } from '../rpc';
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
  clearTokenAmountsAction, setCompleteStatusAction, setLoadingAction, setPoolAction, setStatusAction, setToken1Action, setToken2Action, setTokenPricesAction,
} from '../store/actions/defaultActions';
import { SwapState } from '../store/reducers/swap';
import {
  ButtonStatus,
  calculateAmount,
  calculateAmountWithPercentage,
  calculateDeadline,
  captureError,
  convert2Normal,
  ensure,
  errorHandler,
} from '../utils';
import { findToken } from './useKeepTokenUpdated';
import { useLoadPool } from './useLoadPool';
import { ApolloClient } from '@apollo/client';

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

    // Because of aboves ensure pool would not need explanation mark. Typescript broken...
    const { reserve1, reserve2 } = pool!;
    const amountOut1 = BigNumber.from(calculateAmount(sell));
    const amountOut2 = BigNumber.from(calculateAmount(buy));
    const reserved1 = BigNumber.from(reserve1).sub(amountOut1);
    const reserved2 = BigNumber.from(reserve2).sub(amountOut2);

    ensure(reserved1.gt(0) || reserved2.gt(0), 'Insufficient amounts');

    // WIP checking for ReefswapV2: K error
    // Temporary solution was with `swapExactTokensForTokensSupportingFeeOnTransferTokens` function!
    // Error still arrives when using `swapExactTokensForTokens`

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
  account?: ReefSigner;
  dexClient?: ApolloClient<any>;
  tokenPrices: AddressToNumber<number>;
  dispatch: Dispatch<SwapAction>;
}
export const useSwapState = ({
  state,
  tokens,
  account,
  dexClient,
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
  const tokenBuySet = useRef<boolean>(false);
  const tokenSellSet = useRef<boolean>(false);
  const prevAddress1 = useRef<string>('');
  const prevAddress2 = useRef<string>('');

  // Updating swap pool
  const [loadedPool, isPoolLoading] = useLoadPool(
    sell,
    buy,
    account?.evmAddress || '',
    dexClient,
    isLoading,
  );
  useEffect(() => {
    if (loadedPool) {
      dispatch(setPoolAction(loadedPool));
    }
  }, [loadedPool]);

  // Updating swap tokens
  useEffect(() => {
    if (prevAddress2.current != address2 || (!tokenBuySet.current && buy.address)) {
      const foundToken1 = findToken(address2, tokens);
      const price = tokenPrices[address2];
      setBuy({ ...foundToken1, amount: buy.amount, price });
      tokenBuySet.current = true;
      prevAddress2.current = address2;
    }
    if (prevAddress1.current !== address1 || (!tokenSellSet.current && sell.address)) {
      const foundToken2 = findToken(address1, tokens);
      const price = tokenPrices[address1];
      setSell({ ...foundToken2, amount: sell.amount, price });
      tokenSellSet.current = true;
      prevAddress1.current = address1;
    }
  }, [tokens, tokenPrices, address1, address2]);

  // Updating token prices
  useEffect(() => {
    if ((tokenPrices[address1] || tokenPrices[address2]) && (tokenBuySet.current || tokenSellSet.current)) {
      dispatch(setTokenPricesAction(tokenPrices));
    }
  }, [tokenPrices]);

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
  batchTxs?: boolean;
  notify: NotifyFun;
  dispatch: Dispatch<SwapAction>;
  updateTokenState: () => Promise<void>;
  onSuccess?: (...args: any[]) => any;
  onFinalized?: (...args: any[]) => any;
}

export const onSwap = ({
  state,
  network,
  account,
  batchTxs,
  dispatch,
  updateTokenState,
  onSuccess,
  onFinalized,
}: OnSwap) => async (): Promise<void> => {
  const {
    token1, settings, token2, isValid, isLoading,
  } = state;
  if (!isValid || isLoading || !account || !network) {
    return;
  }
  const { signer, address, evmAddress } = account;
  const { percentage, deadline } = resolveSettings(settings);

  try {
    dispatch(setLoadingAction(true));
    ensureTokenAmount(token1);

    const sellAmount = calculateAmount(token1);
    const minBuyAmount = calculateAmountWithPercentage(token2, percentage);
    const reefswapRouter = getReefswapRouter(network.routerAddress, signer);

    const sellTokenContract = new Contract(token1.address, ERC20, signer);

    dispatch(setStatusAction('Executing trade'));
    const approveTransaction = await sellTokenContract.populateTransaction.approve(
      network.routerAddress,
      sellAmount,
    );
    const tradeTransaction = await reefswapRouter.populateTransaction.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      sellAmount,
      minBuyAmount,
      [token1.address, token2.address],
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
      const tradeExtrinsic = signer.provider.api.tx.evm.call(
        tradeTransaction.to,
        tradeTransaction.data,
        BigNumber.from(tradeTransaction.value || 0),
        BigNumber.from(582938).mul(2), // hardcoded gas estimation, multiply by 2 as a safety margin
        BigNumber.from(64).mul(2), // hardcoded storage estimation, multiply by 2 as a safety margin
      );

      // Batching extrinsics
      const batch = signer.provider.api.tx.utility.batchAll([
        approveExtrinsic,
        tradeExtrinsic,
      ]);

      // Signing and awaiting when data comes in block
      const signAndSend = new Promise<void>(async (resolve, reject) => {
        batch.signAndSend(
          address,
          { signer: signer.signingKey },
          (status: any) => {
            const err = captureError(status.events);
            if (err) {
              reject({message: err});
            }
            if (status.dispatchError) {
              reject({message: status.dispatchError.toString()});
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
      // Approve
      const signAndSendApprove = new Promise<void>(async (resolve, reject) => {
        approveExtrinsic.signAndSend(
          address,
          { signer: signer.signingKey },
          (status: any) => {
            const err = captureError(status.events);
            if (err) {
              reject({message: err});
            }
            if (status.dispatchError) {
              console.error(status.dispatchError.toString());
              reject({message: status.dispatchError.toString()});
            }
            if (status.status.isInBlock) {
              resolve();
            }
          },
        );
      });
      await signAndSendApprove;

      // Swap
      const tradeResources = await signer.provider.estimateResources(tradeTransaction);
      const tradeExtrinsic = signer.provider.api.tx.evm.call(
        tradeTransaction.to,
        tradeTransaction.data,
        BigNumber.from(tradeTransaction.value || 0),
        tradeResources.gas,
        tradeResources.storage.lt(0) ? BigNumber.from(0) : tradeResources.storage,
      );

      const signAndSendTrade = new Promise<void>(async (resolve, reject) => {
        tradeExtrinsic.signAndSend(
          address,
          { signer: signer.signingKey },
          (status: any) => {
            const err = captureError(status.events);
            if (err) {
              reject({message: err});
            }
            if (status.dispatchError) {
              console.error(status.dispatchError.toString());
              reject({message: status.dispatchError.toString()});
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
      await signAndSendTrade;
    }

    if (onSuccess) onSuccess();

    Uik.notify.success({
      message: 'Trade complete.\nBalances will reload after blocks are finalized',
      keepAlive: true,
    });

    Uik.dropConfetti();
  } catch (error) {
    const message = errorHandler(error.message);
    Uik.notify.danger({
      message: `An error occurred while trying to complete your trade: ${message}`,
      keepAlive: true,
    });
  } finally {
    await updateTokenState().catch(() => Uik.notify.danger({
      message: 'Please reload the page to update token balances',
      keepAlive: true,
    }));

    dispatch(setLoadingAction(false));
    dispatch(clearTokenAmountsAction());
  }
};
