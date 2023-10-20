import Uik from '@reef-chain/ui-kit';
import React, { Dispatch, useEffect } from 'react';
import { BigNumber, Contract } from 'ethers';
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
import { AxiosInstance } from 'axios';

interface UseAddLiquidityState {
  address1: string;
  address2: string;
  state: AddLiquidityState;
  tokens: Token[];
  httpClient?: AxiosInstance;
  signer?: ReefSigner;
  tokenPrices: AddressToNumber<number>;
  dispatch: Dispatch<AddLiquidityActions>;
}

const getInsufficientTokenSymbol = (token1:TokenWithAmount,token2:TokenWithAmount):string=>{
  if(token1.balance._hex=="0x00"){
    return token1.symbol
  }return token2.symbol
}

const status = (
  token1: TokenWithAmount,
  token2: TokenWithAmount,
  isEvmClaimed?: boolean,
): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind account');
    ensure(!token1.isEmpty, 'Select token 1');
    ensure(!token2.isEmpty, 'Select token 2');
    ensure(token1.amount.length > 0, `Missing ${token1.symbol} amount`);
    ensure(token2.amount.length > 0, `Missing ${token2.symbol} amount`);
    ensure(
      BigNumber.from(calculateAmount(token1)).lte(token1.balance) && BigNumber.from(calculateAmount(token1)).gt(0),
      `Insufficient ${getInsufficientTokenSymbol(token1,token2)} balance`,
    );
    ensure(
      BigNumber.from(calculateAmount(token2)).lte(token2.balance) && BigNumber.from(calculateAmount(token1)).gt(0),
      `Insufficient ${getInsufficientTokenSymbol(token1,token2)} balance`,
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
  httpClient,
  tokenPrices,
}: UseAddLiquidityState): void => {
  const {
    token1, token2, pool, isLoading, isValid,
  } = state;
  const [loadedPool, isPoolLoading] = useLoadPool(
    token1,
    token2,
    signer?.address || '',
    httpClient,
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
  batchTxs?: boolean;
  notify: NotifyFun;
  dispatch: Dispatch<AddLiquidityActions>;
  updateTokenState: () => Promise<void>;
  onSuccess?: (...args: any[]) => any;
  onFinalized?: (...args: any[]) => any;
}

export const onAddLiquidity = ({
  state,
  network,
  signer,
  batchTxs,
  dispatch,
  updateTokenState,
  onSuccess,
  onFinalized,
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
    const approveTransaction1 = await token1Contract.populateTransaction.approve(network.routerAddress, amount1);
    const approveTransaction2 = await token2Contract.populateTransaction.approve(network.routerAddress, amount2);
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
    const approveResources1 = await signer.signer.provider.estimateResources(approveTransaction1);
    const approveResources2 = await signer.signer.provider.estimateResources(approveTransaction2);

    // Creating transaction extrinsics
    const approveExtrinsic1 = signer.signer.provider.api.tx.evm.call(
      approveTransaction1.to,
      approveTransaction1.data,
      BigNumber.from(approveTransaction1.value || 0),
      approveResources1.gas,
      approveResources1.storage.lt(0) ? BigNumber.from(0) : approveResources1.storage,
    );
    const approveExtrinsic2 = signer.signer.provider.api.tx.evm.call(
      approveTransaction2.to,
      approveTransaction2.data,
      BigNumber.from(approveTransaction2.value || 0),
      approveResources2.gas,
      approveResources2.storage.lt(0) ? BigNumber.from(0) : approveResources2.storage,
    );

    const disableStakeBtn = ()=>{
      dispatch(
        setCompleteStatusAction("Adding Supply", false, true),
      )
    }

    if (batchTxs) {
      const provideExtrinsic = signer.signer.provider.api.tx.evm.call(
        provideTransaction.to,
        provideTransaction.data,
        BigNumber.from(provideTransaction.value || 0),
        BigNumber.from(9636498), // Value was used from estimateResources, which can only be ran if tokens are approved
        BigNumber.from(68206), // Value was used from estimateResources, which can only be ran if tokens are approved
      );

      // Batching extrinsics
      const batch = signer.signer.provider.api.tx.utility.batchAll([
        approveExtrinsic1,
        approveExtrinsic2,
        provideExtrinsic,
      ]);

      // Signing and awaiting when data comes in block
      const signAndSend = new Promise<void>(async (resolve, reject) => {
        batch.signAndSend(
          signer.address,
          { signer: signer.signer.signingKey },
          (status: any) => {
            console.log('Stake status: ', status);
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
            // TODO handle error - somehow
            // First find it

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
      // Approve token 1
      const allowance1 = await token1Contract.allowance(signer.evmAddress, network.routerAddress);
      if (allowance1.lt(amount1)) {
        const signAndSendApprove1 = new Promise<void>((resolve, reject) => {
          approveExtrinsic1.signAndSend(
            signer.address,
            { signer: signer.signer.signingKey },
            (status: any) => {
              disableStakeBtn();
              console.log('Stake status: ', status);
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
            },
          );
        });
        await signAndSendApprove1;
      }

      // Approve token 2
      const allowance2 = await token2Contract.allowance(signer.evmAddress, network.routerAddress);
      if (allowance2.lt(amount2)) {
        const signAndSendApprove2 = new Promise<void>((resolve, reject) => {
          disableStakeBtn();
          approveExtrinsic2.signAndSend(
            signer.address,
            { signer: signer.signer.signingKey },
            (status: any) => {
              console.log('Stake status: ', status);
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
            },
          );
        });
        await signAndSendApprove2;
      }

      // Provide liquidity
      const provideResources = await signer.signer.provider.estimateResources(provideTransaction);
      const provideExtrinsic = signer.signer.provider.api.tx.evm.call(
        provideTransaction.to,
        provideTransaction.data,
        BigNumber.from(provideTransaction.value || 0),
        provideResources.gas,
        provideResources.storage.lt(0) ? BigNumber.from(0) : provideResources.storage,
      );

      const signAndSendProvide = new Promise<void>((resolve, reject) => {
        disableStakeBtn()
        provideExtrinsic.signAndSend(
          signer.address,
          { signer: signer.signer.signingKey },
          (status: any) => {
            console.log('Stake status: ', status);
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
      await signAndSendProvide;
    }

    if (onSuccess) onSuccess();

    Uik.notify.success({
      message: 'Successfully provided liquidity.\nBalances will reload after blocks are finalized.',
      keepAlive: true,
    });

    Uik.dropConfetti();
  } catch (error) {
    const message = errorHandler(error.message)
      .replace('first', token1.name)
      .replace('second', token2.name);

    Uik.prompt({
      type: 'danger',
      title: 'Transaction has failed',
      message: `An error occurred while trying to provide liquidity: ${message}\nYour assets remain unchanged.`,
      actions: <Uik.Button text="Close" danger />,
    });
  } finally {
    /* TODO const newTokens = await loadTokens(tokens, sgnr);
    dispatch(setAllTokensAction(newTokens)); */
    await updateTokenState().catch(() => Uik.notify.danger({
      message: 'Please reload the page to update token balances',
      keepAlive: true,
    }));
    dispatch(setLoadingAction(false));
    dispatch(clearTokenAmountsAction());
  }
};