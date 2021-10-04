import React, { useMemo, useState } from 'react';
import { BigNumber } from 'ethers';
import {
  createEmptyTokenWithAmount, defaultSettings, ensureTokenAmount, Network, Notify, Pool, ReefSigner, reefTokenWithAmount, resolveSettings, Token, TokenWithAmount,
} from '../../state';
import { ButtonStatus, ensure } from '../../utils';
import {
  convert2Normal, calculateAmount, getOutputAmount, getInputAmount, calculateAmountWithPercentage, calculateDeadline, calculateImpactPercentage,
} from '../../utils/math';
import { useLoadPool } from '../../hooks';
import { getReefswapRouter } from '../../rpc';
import { useUpdateBalance } from '../../hooks/useUpdateBalance';
import { useUpdateSwapAmount } from '../../hooks/useUpdateAmount';
import { useUpdateTokensPrice } from '../../hooks/useUpdateTokensPrice';
import { approveTokenAmount } from '../../rpc/tokens';
import {
  Card, CardHeader, CardHeaderBlank, CardTitle,
} from '../common/Card';
import { TokenAmountFieldImpactPrice, TokenAmountFieldMax } from '../TokenFields';
import { SwitchTokenButton } from '../common/Button';
import SwapConfirmationModal from './SwapConfirmationModal';
import { CenterColumn, MT } from '../common/Display';
import { OpenModalButton } from '../common/Modal';
import { LoadingButtonIconWithText } from '../common/Loading';
import { TransactionSettings } from '../TransactionSettings';

interface SwapComponent {
  tokens: Token[];
  network: Network;
  account?: ReefSigner;
  reloadTokens: () => void;
  notify: (message: string, type: Notify) => void;
}

const swapStatus = (sell: TokenWithAmount, buy: TokenWithAmount, isEvmClaimed?: boolean, pool?: Pool): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind account');
    ensure(!sell.isEmpty, 'Select sell token');
    ensure(!buy.isEmpty, 'Select buy token');
    ensure(!!pool, 'Invalid pair');
    ensure(sell.amount.length !== 0, `Missing ${sell.name} amount`);
    ensure(buy.amount.length !== 0, `Missing ${buy.name} amount`);
    ensure(parseFloat(sell.amount) > 0, `Missing ${sell.name} amount`);
    ensure(parseFloat(sell.amount) <= convert2Normal(sell.decimals, sell.balance.toString()), `Insufficient ${sell.name} balance`);

    // Because of aboves ensure pool would not need explenation mark. Typescript broken...
    const {
      token1, token2, reserve1, reserve2,
    } = pool!;
    const amountOut1 = BigNumber.from(calculateAmount(sell));
    const amountOut2 = BigNumber.from(calculateAmount(buy));
    const reserved1 = BigNumber.from(reserve1);// .sub(amountOut1);
    const reserved2 = BigNumber.from(reserve2);// .sub(amountOut2);

    const amountIn1 = token1.balance.gt(reserved1.sub(amountOut1))
      ? token1.balance.sub(reserved1.sub(amountOut1))
      : BigNumber.from(0);

    const amountIn2 = token2.balance.gt(reserved2.sub(amountOut2))
      ? token2.balance.sub(reserved2.sub(amountOut2))
      : BigNumber.from(0);

    ensure(amountIn1.gt(0) || amountIn2.gt(0), 'Insufficient amounts');

    // WIP checking for ReefswapV2: K error
    // Temporary solution was with `swapExactTokensForTokensSupportingFeeOnTransferTokens` function!
    // Error still arives when using `swapExactTokensForTokens`

    // const balanceAdjuster1 = token1.balance.mul(1000).sub(amountIn1.mul(3));
    // const balanceAdjuster2 = token2.balance.mul(1000).sub(amountIn2.mul(3));

    // const reserved = reserved1.mul(reserved2).mul(1000 ** 2);
    // const balance = balanceAdjuster1.mul(balanceAdjuster2);
    // ensure(balance.gte(reserved), 'Deliquified pool');
    // ensure(amountOut1.eq(amountIn1) && amountOut2.eq(amountIn2), 'Deliquified pool')
    return { isValid: true, text: 'Swap' };
  } catch (e) {
    return { isValid: false, text: e.message };
  }
};

const loadingStatus = (status: string, isPoolLoading: boolean, isPriceLoading: boolean): string => {
  if (status) { return status; }
  if (isPoolLoading) { return 'Loading pool'; }
  if (isPriceLoading) { return 'Loading prices'; }
  return '';
};

export const SwapComponent = ({
  tokens, network, account, notify, reloadTokens,
} : SwapComponent): JSX.Element => {
  const [buy, setBuy] = useState(createEmptyTokenWithAmount());
  const [sell, setSell] = useState(reefTokenWithAmount());
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [isSwapLoading, setIsSwapLoading] = useState(false);

  const [pool, isPoolLoading] = useLoadPool(sell, buy, network.factoryAddress, account?.signer);

  const { percentage, deadline } = resolveSettings(settings);
  const { text, isValid } = useMemo(
    () => swapStatus(sell, buy, account?.isEvmClaimed, pool),
    [sell, buy, percentage, account?.isEvmClaimed, pool],
  );

  useUpdateBalance(buy, tokens, setBuy);
  useUpdateBalance(sell, tokens, setSell);
  const isPriceLoading = useUpdateTokensPrice({
    pool,
    token1: sell,
    token2: buy,
    tokens,
    signer: account?.signer,
    factoryAddress: network.factoryAddress,
    setToken1: setSell,
    setToken2: setBuy,
  });

  const isLoading = isSwapLoading || isPoolLoading || isPriceLoading;
  useUpdateSwapAmount({
    pool,
    token2: buy,
    token1: sell,
    setToken2: setBuy,
    setToken1: setSell,
  });

  const setSellAmount = (amount: string): void => {
    if (isLoading) { return; }
    const amo = pool && amount !== ''
      ? getOutputAmount({ ...sell, amount }, pool).toFixed(4)
      : '';

    setSell({ ...sell, amount });
    setBuy({ ...buy, amount: amo });
  };
  const setBuyAmount = (amount: string): void => {
    if (isLoading) { return; }
    const amo = pool && amount !== ''
      ? getInputAmount({ ...buy, amount }, pool).toFixed(4)
      : '';

    setBuy({ ...buy, amount });
    setSell({ ...sell, amount: amo });
  };

  const changeBuyToken = (newToken: Token): void => setBuy({
    ...newToken, amount: '', price: 0, isEmpty: false,
  });
  const changeSellToken = (newToken: Token): void => setSell({
    ...newToken, amount: '', price: 0, isEmpty: false,
  });

  const onSwitch = (): void => {
    if (buy.isEmpty || isLoading || !pool) { return; }
    const subSellState = { ...sell };
    setSell({ ...buy });
    setBuy({ ...subSellState, amount: getOutputAmount(buy, pool).toFixed(4) });
  };

  const onSwap = async (): Promise<void> => {
    if (!isValid || !account) { return; }
    const { signer, evmAddress } = account;
    try {
      setIsSwapLoading(true);
      ensureTokenAmount(sell);

      setStatus(`Approving ${sell.name} token`);
      const sellAmount = calculateAmount(sell);
      const minBuyAmount = calculateAmountWithPercentage(buy, percentage);
      const reefswapRouter = getReefswapRouter(network.routerAddress, signer);
      await approveTokenAmount(sell, network.routerAddress, signer);

      setStatus('Executing swap');
      await reefswapRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        sellAmount,
        minBuyAmount,
        [sell.address, buy.address],
        evmAddress,
        calculateDeadline(deadline),

      );
      notify('Swap complete!', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      // TODO move this out!
      reloadTokens();
      setIsSwapLoading(false);
      setStatus('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardHeaderBlank />
        <CardTitle title="Swap" />
        <TransactionSettings settings={settings} setSettings={setSettings} />
      </CardHeader>

      <TokenAmountFieldMax
        token={sell}
        tokens={tokens}
        id="sell-token-field"
        onAmountChange={setSellAmount}
        onTokenSelect={changeSellToken}
      />
      <SwitchTokenButton onClick={onSwitch} />
      <TokenAmountFieldImpactPrice
        token={buy}
        tokens={tokens}
        id="buy-token-field"
        percentage={calculateImpactPercentage(sell, buy)}
        onAmountChange={setBuyAmount}
        onTokenSelect={changeBuyToken}
      />
      <MT size="2">
        <CenterColumn>
          <OpenModalButton id="swapModalToggle">
            {isLoading ? <LoadingButtonIconWithText text={loadingStatus(status, isPoolLoading, isPriceLoading)} /> : text}
          </OpenModalButton>
        </CenterColumn>
      </MT>
      <SwapConfirmationModal
        buy={buy}
        sell={sell}
        id="swapModalToggle"
        percentage={settings.percentage}
        confirmFun={onSwap}
      />
    </Card>
  );
};
