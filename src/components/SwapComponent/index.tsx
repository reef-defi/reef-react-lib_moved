import React, { useMemo, useState } from 'react';
import { BigNumber } from 'ethers';
import {
  createEmptyTokenWithAmount,
  DefaultOptions,
  defaultOptions,
  defaultSettings,
  ensureTokenAmount,
  Network,
  Pool,
  ReefSigner,
  resolveSettings,
  Token,
  TokenSelector,
  TokenWithAmount,
} from '../../state';
import { ButtonStatus, ensure } from '../../utils';
import {
  calculateAmount,
  calculateAmountWithPercentage,
  calculateDeadline,
  calculateImpactPercentage,
  convert2Normal,
  getInputAmount,
  getOutputAmount,
} from '../../utils/math';
import { useLoadPool } from '../../hooks/useLoadPool';
import { getReefswapRouter } from '../../rpc';
import { useUpdateBalance } from '../../hooks/useUpdateBalance';
import { useUpdateSwapAmount } from '../../hooks/useUpdateAmount';
import { useUpdateTokensPrice } from '../../hooks/useUpdateTokensPrice';
import { approveTokenAmount } from '../../rpc/tokens';
import {
  Card, CardHeader, CardHeaderBlank, CardTitle,
} from '../common/Card';
import {
  TokenAmountFieldImpactPrice,
  TokenAmountFieldMax,
} from '../TokenFields';
import { SwitchTokenButton } from '../common/Button';
import SwapConfirmationModal from './SwapConfirmationModal';
import { CenterColumn, ComponentCenter, MT } from '../common/Display';
import { OpenModalButton } from '../common/Modal';
import { LoadingButtonIconWithText } from '../common/Loading';
import { TransactionSettings } from '../TransactionSettings';

interface SwapComponent {
  tokens: Token[];
  buyToken: TokenWithAmount;
  sellToken: TokenWithAmount;
  network: Network;
  account: ReefSigner;
  options?: Partial<DefaultOptions>;
}

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
    ensure(sell.amount.length !== 0, `Missing ${sell.name} amount`);
    ensure(buy.amount.length !== 0, `Missing ${buy.name} amount`);
    ensure(parseFloat(sell.amount) > 0, `Missing ${sell.name} amount`);
    ensure(
      parseFloat(sell.amount)
        <= convert2Normal(sell.decimals, sell.balance.toString()),
      `Insufficient ${sell.name} balance`,
    );

    // Because of aboves ensure pool would not need explenation mark. Typescript broken...
    const {
      token1, token2, reserve1, reserve2,
    } = pool!;
    const amountOut1 = BigNumber.from(calculateAmount(sell));
    const amountOut2 = BigNumber.from(calculateAmount(buy));
    const reserved1 = BigNumber.from(reserve1); // .sub(amountOut1);
    const reserved2 = BigNumber.from(reserve2); // .sub(amountOut2);

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

export type SwapFocus = 'buy' | 'sell';

const loadingStatus = (
  status: string,
  isPoolLoading: boolean,
  isPriceLoading: boolean,
): string => {
  if (status) {
    return status;
  }
  if (isPoolLoading) {
    return 'Loading pool';
  }
  if (isPriceLoading) {
    return 'Loading prices';
  }
  return '';
};

export const SwapComponent = ({
  tokens,
  network,
  account,
  buyToken,
  sellToken,
  // onTxUpdate,
  options,
}: SwapComponent): JSX.Element => {
  const [buy, setBuy] = useState(buyToken);
  const [sell, setSell] = useState(sellToken);
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [isSwapLoading, setIsSwapLoading] = useState(false);
  const [focus, setFocus] = useState<SwapFocus>('sell');
console.log('yyyyy')
  const {
    notify, onAddressChange, onTokenSelect, updateTokenState,
  } = { ...defaultOptions, ...options };

  const [pool, isPoolLoading] = useLoadPool(
    sell,
    buy,
    network.factoryAddress,
    account?.signer,
  );

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
    setFocus('sell');
    const amo = pool && amount !== ''
      ? getOutputAmount({ ...sell, amount }, pool).toFixed(4)
      : '';

    setSell({ ...sell, amount });
    setBuy({ ...buy, amount: amo });
  };
  const setBuyAmount = (amount: string): void => {
    if (isLoading) { return; }
    setFocus('buy');
    const amo = pool && amount !== ''
      ? getInputAmount({ ...buy, amount }, pool).toFixed(4)
      : '';

    setBuy({ ...buy, amount });
    setSell({ ...sell, amount: amo });
  };

  const onSwitch = (): void => {
    if (isLoading) { return; }
    if (focus === 'buy') {
      const subSell = { ...sell };
      setSell({ ...buy });
      setBuy({ ...subSell, amount: '', price: 0 });
      setFocus('sell');
    } else {
      const subBuy = { ...buy };
      setBuy({ ...sell });
      setSell({ ...subBuy, amount: '', price: 0 });
      setFocus('buy');
    }
  };

  // eslint-disable-next-line
  const changeToken = (type: TokenSelector) => (newToken: Token): void => {
    onTokenSelect(newToken.address, type);
    const tokenWithamo: TokenWithAmount = {
      ...createEmptyTokenWithAmount(false),
      ...newToken,
    };
    switch (type) {
      case 'token1': return setSell(tokenWithamo);
      case 'token2': return setBuy(tokenWithamo);
      default:
    }
  };

  const onSwap = async (): Promise<void> => {
    if (!isValid || !account) {
      return;
    }
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
      notify('Balances will reload after blocks are finalized.', 'info');
      notify('Swap complete!');
    } catch (error) {
      console.error(error);
      notify(`There was an error when swapping: ${error.message}`, 'error');
    } finally {
      await updateTokenState()
        .catch(() => notify('Token balances were not updated, to do so reload page.', 'warning'));
      setIsSwapLoading(false);
      setStatus('');
    }
  };

  return (
    <ComponentCenter>
      <Card>
        <CardHeader>
          <CardHeaderBlank />
          <CardTitle title="Swap" />
          <TransactionSettings settings={settings} setSettings={setSettings} />
        </CardHeader>

        <TokenAmountFieldMax
          token={sell}
          tokens={tokens}
          signer={account}
          id="sell-token-field"
          onAmountChange={setSellAmount}
          onTokenSelect={changeToken('token1')}
          onAddressChange={onAddressChange}
        />
        <SwitchTokenButton onClick={onSwitch} />
        <TokenAmountFieldImpactPrice
          token={buy}
          tokens={tokens}
          signer={account}
          id="buy-token-field"
          percentage={calculateImpactPercentage(sell, buy)}
          onAmountChange={setBuyAmount}
          onTokenSelect={changeToken('token2')}
          onAddressChange={onAddressChange}
        />
        <MT size="2">
          <CenterColumn>
            <OpenModalButton id="swapModalToggle" disabled={!isValid || isLoading}>
              {isLoading ? (
                <LoadingButtonIconWithText
                  text={loadingStatus(status, isPoolLoading, isPriceLoading)}
                />
              ) : (
                text
              )}
            </OpenModalButton>
          </CenterColumn>
        </MT>
        <SwapConfirmationModal
          buy={buy}
          sell={sell}
          id="swapModalToggle"
          percentage={percentage}
          confirmFun={onSwap}
        />
      </Card>
    </ComponentCenter>
  );
};
