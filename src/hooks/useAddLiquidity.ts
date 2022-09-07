import Uik from '@reef-defi/ui-kit';
import { BigNumber, Contract } from 'ethers';
import { Dispatch, useEffect } from 'react';
import { ERC20 } from '../assets/abi/ERC20';
import { getReefswapRouter } from '../rpc';
import {
  AddressToNumber,
  Network,
  NotifyFun, ReefSigner,
  resolveSettings,
  Token,
  TokenWithAmount,
} from '../state';
import {
  AddLiquidityActions,
  SetNewPoolSupplyAction,
} from '../store/actions/addLiquidity';
import {
  clearTokenAmountsAction,
  setCompleteStatusAction,
  setLoadingAction,
  setPoolAction,
  setStatusAction,
  setToken1Action,
  setToken2Action,
} from '../store/actions/defaultActions';
import { AddLiquidityState } from '../store/reducers/addLiquidity';
import {
  ButtonStatus,
  calculateAmount,
  calculateAmountWithPercentage,
  calculateDeadline,
  calculatePoolSupply,
  captureError,
  ensure,
  ensureAmount,
  errorHandler,
} from '../utils';
import { useKeepTokenUpdated } from './useKeepTokenUpdated';
import { useLoadPool } from './useLoadPool';
import { useUpdateLiquidityAmount } from './useUpdateAmount';

interface UseAddLiquidityState {
  address1: string;
  address2: string;
  state: AddLiquidityState;
  tokens: Token[];
  network?: Network;
  signer?: ReefSigner;
  tokenPrices: AddressToNumber<number>;
  dispatch: Dispatch<AddLiquidityActions>;
}

const status = (
  token1: TokenWithAmount,
  token2: TokenWithAmount,
  isEvmClaimed?: boolean,
): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind signer');
    ensure(!token1.isEmpty, 'Select token 1');
    ensure(!token2.isEmpty, 'Select token 2');
    ensure(token1.amount.length > 0, `Missing ${token1.symbol} amount`);
    ensure(token2.amount.length > 0, `Missing ${token2.symbol} amount`);
    ensure(
      BigNumber.from(calculateAmount(token1)).lte(token1.balance),
      `Insufficient ${token1.symbol} balance`,
    );
    ensure(
      BigNumber.from(calculateAmount(token2)).lte(token2.balance),
      `Insufficient ${token2.symbol} balance`,
    );
    return { isValid: true, text: 'Stake' };
  } catch (e) {
    return { isValid: false, text: e.message };
  }
};

export const useAddLiquidity = ({
  address1,
  address2,
  dispatch,
  state,
  tokens,
  signer,
  network,
  tokenPrices,
}: UseAddLiquidityState): void => {
  const {
    token1, token2, pool, isLoading, isValid,
  } = state;
  const [loadedPool, isPoolLoading] = useLoadPool(
    token1,
    token2,
    network?.factoryAddress || '',
    signer?.signer,
    isLoading,
  );
  const newPoolSupply = calculatePoolSupply(token1, token2, pool);

  const setToken1 = (token: TokenWithAmount): void => dispatch(setToken1Action(token));
  const setToken2 = (token: TokenWithAmount): void => dispatch(setToken2Action(token));

  // find and set tokens based on addresses
  // useTokensFinder({
  //   address1,
  //   address2,
  //   tokens,
  //   signer,
  //   setToken1,
  //   setToken2,
  // });
  // Keeping tokens updated
  useKeepTokenUpdated(address1, token1, tokens, tokenPrices, setToken1);
  useKeepTokenUpdated(address2, token2, tokens, tokenPrices, setToken2);

  // update liquidity amount based on price
  useUpdateLiquidityAmount({
    pool,
    token1,
    token2,
    setToken1,
    setToken2,
  });
  // updating pool once its loaded
  useEffect(() => {
    if (loadedPool) {
      dispatch(setPoolAction(loadedPool));
    }
  }, [loadedPool]);
  // Updating new pool supply
  useEffect(() => {
    dispatch(SetNewPoolSupplyAction(newPoolSupply.toFixed(8)));
  }, [newPoolSupply]);
  // Updating status
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
      const { isValid, text } = status(
        token1,
        token2,
        signer?.isEvmClaimed || false,
      );
      currentStatus = text;
      currentIsValid = isValid;
      currentIsLoading = false;
    }
    dispatch(
      setCompleteStatusAction(currentStatus, currentIsValid, currentIsLoading),
    );
  }, [
    token1,
    token2,
    signer?.isEvmClaimed,
    pool,
    isPoolLoading,
  ]);
};

interface OnAddLiquidity {
  state: AddLiquidityState;
  network?: Network;
  signer?: ReefSigner;
  notify: NotifyFun;
  dispatch: Dispatch<AddLiquidityActions>;
  updateTokenState: () => Promise<void>;
}

export const onAddLiquidity = ({
  state,
  network,
  signer,
  dispatch,
  updateTokenState,
}: OnAddLiquidity) => async (): Promise<void> => {
  if (!signer || !network) {
    return;
  }
  const { token1, token2, settings } = state;
  const { percentage, deadline } = resolveSettings(settings);
  try {
    dispatch(setLoadingAction(true));
    ensureAmount(token1);
    ensureAmount(token2);

    const reefswapRouter = getReefswapRouter(
      network.routerAddress,
      signer.signer,
    );

    const amount1 = calculateAmount(token1);
    const amount2 = calculateAmount(token2);
    const percentage1 = calculateAmountWithPercentage(token1, percentage);
    const percentage2 = calculateAmountWithPercentage(token2, percentage);

    dispatch(setStatusAction('Adding supply'));
    const token1Contract = new Contract(token1.address, ERC20, signer.signer);
    const token2Contract = new Contract(token2.address, ERC20, signer.signer);

    // Populating transactions
    const approvetTransaction1 = await token1Contract.populateTransaction.approve(network.routerAddress, amount1);
    const approvetTransaction2 = await token2Contract.populateTransaction.approve(network.routerAddress, amount2);
    const provideTransaction = await reefswapRouter.populateTransaction.addLiquidity(
      token1.address,
      token2.address,
      amount1,
      amount2,
      percentage1,
      percentage2,
      signer.evmAddress,
      calculateDeadline(deadline),
    );

    // estimating resources for token approval
    const resources = await signer.signer.provider.estimateResources(approvetTransaction1);

    // Creating transaction extrinsics
    const approveExtrinsic1 = signer.signer.provider.api.tx.evm.call(
      approvetTransaction1.to,
      approvetTransaction1.data,
      BigNumber.from(approvetTransaction1.value || 0),
      resources.gas,
      resources.storage.lt(0) ? BigNumber.from(0) : resources.storage,
    );
    const approveExtrinsic2 = signer.signer.provider.api.tx.evm.call(
      approvetTransaction2.to,
      approvetTransaction2.data,
      BigNumber.from(approvetTransaction2.value || 0),
      resources.gas,
      resources.storage.lt(0) ? BigNumber.from(0) : resources.storage,
    );
    const provideExtrinsic = signer.signer.provider.api.tx.evm.call(
      provideTransaction.to,
      provideTransaction.data,
      BigNumber.from(provideTransaction.value || 0),
      BigNumber.from(605379).mul(2), // Value was used from estimateResources, which can only be ran if tokens are approved. multiple 2 is a safty net.
      BigNumber.from(0),
    );

    // Batching extrinsics
    const batch = signer.signer.provider.api.tx.utility.batchAll([
      approveExtrinsic1,
      approveExtrinsic2,
      provideExtrinsic,
    ]);

    // Signing and awaiting when data comes in block
    await new Promise<void>(async (resolve, reject) => {
      batch.signAndSend(
        signer.address,
        { signer: signer.signer.signingKey },
        (status: any) => {
          console.log('Stake status: ', status);
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
          // TODO handle error - somehow
          // First find it

          // If you want to await until block is finalized use below if
          // if (status.status.isFinalized) {
          // resolve();
          // }
        },
      );
    });

    Uik.notify.success({
      message: 'Successfully provided liquidity.\nBalances will reload after blocks are finalized.',
      keepAlive: true,
    });

    Uik.dropConfetti();
  } catch (error) {
    const message = errorHandler(error.message)
      .replace('first', token1.name)
      .replace('second', token2.name);

    Uik.notify.danger({
      message: `An error occurred while trying to provide liquidity: ${message}`,
      keepAlive: true,
    });
  } finally {
    /* TODO const newTokens = await loadTokens(tokens, sgnr);
    dispatch(setAllTokensAction(newTokens)); */
    await updateTokenState().catch(() => Uik.notify.danger({
      message: 'Please reaload the page to update token balances',
      keepAlive: true,
    }));
    dispatch(setLoadingAction(false));
    dispatch(clearTokenAmountsAction());
  }
};
