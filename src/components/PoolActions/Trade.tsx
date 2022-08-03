import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import Uik from '@reef-defi/ui-kit';
import BigNumber from 'bignumber.js';
import React, { useMemo, useState } from 'react';
import { SwapState } from '../../store';
import TokenField, { SelectToken } from './TokenField';

import { Pool, resolveSettings } from '../../state';
import TradePopup from './ConfirmPopups/Trade';

export interface TradeActions {
  onSwitch: () => void;
  onSwap: () => Promise<void>;
  setToken1Amount: (amount: string) => void;
  setToken2Amount: (amount: string) => void;
  setPercentage: (amount: number) => void;
  selectToken1?: SelectToken;
  selectToken2?: SelectToken;
}

interface Trade {
  state: SwapState,
  actions: TradeActions
}

interface SummaryItem {
  label: string,
  value?: string,
  empty?: boolean,
  className?: string
}

const SummaryItem = ({
  label,
  value,
  empty,
  className,
}: SummaryItem): JSX.Element => (
  <div
    className={`
      uik-pool-actions__summary-item
      ${empty ? 'uik-pool-actions__summary-item--empty' : ''}
      ${className || ''}
    `}
  >
    <div className="uik-pool-actions__summary-item-label">{ label }</div>
    <div className="uik-pool-actions__summary-item-value">{ value }</div>
  </div>
);

const calculateRate = (
  sellTokenAddress: string,
  {
    token1: {
      address,
      symbol: symbol1,
      decimals: decimals1,
    },
    token2: {
      symbol: symbol2,
      decimals: decimals2,
    },
    reserve1,
    reserve2,
  }: Pool,
): string => {
  const r1 = new BigNumber(reserve1).div(new BigNumber(10).pow(decimals1));
  const r2 = new BigNumber(reserve2).div(new BigNumber(10).pow(decimals2));
  const res = sellTokenAddress === address ? r1.div(r2) : r2.div(r1);
  return `1 ${symbol2} = ${Uik.utils.maxDecimals(res.toNumber(), 4)} ${symbol1}`;
};

const Trade = ({
  state: {
    token1,
    percentage,
    token2,
    focus,
    isLoading,
    isValid,
    pool,
    settings,
    status,
  }, actions: {
    onSwap,
    onSwitch,
    setPercentage,
    setToken1Amount,
    setToken2Amount,
    selectToken1,
    selectToken2,
  },
} : Trade): JSX.Element => {
  const { percentage: slippage } = resolveSettings(settings);
  const rate = pool ? calculateRate(token1.address, pool) : undefined;
  const [isPopupOpen, setPopupOpen] = useState(false);

  const fee = useMemo(() => {
    if (token1.amount === '') {
      return '0 $';
    }
    return `${new BigNumber(token1.amount)
      .multipliedBy(token1.price)
      .multipliedBy(0.0003)
      .toFixed(4)} $`;
  }, [token1.amount, token1.address, token1.price]);

  return (
    <div>
      <div className="uik-pool-actions__tokens">
        <TokenField
          token={token1}
          onAmountChange={setToken1Amount}
          selectToken={selectToken1}
        />

        <div className="uik-pool-actions__token-switch">
          <button
            type="button"
            className={`
              uik-pool-actions__token-switch-btn
              ${focus === 'buy' ? 'uik-pool-actions__token-switch-btn--reversed' : ''}
            `}
            onClick={onSwitch}
          >
            <Uik.Icon icon={faRepeat} />
          </button>
        </div>

        <TokenField
          token={token2}
          onAmountChange={setToken2Amount}
          selectToken={selectToken2}
        />
      </div>

      <div className="uik-pool-actions__summary uik-pool-actions__trade-summary">
        <SummaryItem
          label="Rate"
          value={rate}
          empty={!rate}
        />
        <SummaryItem
          label="Fee"
          value={fee}
          empty={!fee}
        />
        <SummaryItem
          label="Slippage"
          className={slippage > 3 ? 'uik-pool-actions__trade-slippage--warn' : ''}
          value={`${slippage}%`}
          empty={!slippage}
        />
      </div>

      <div className="uik-pool-actions__slider">
        <Uik.Slider
          value={percentage}
          onChange={setPercentage}
          tooltip={`${Uik.utils.maxDecimals(percentage, 2)}%`}
          helpers={[
            { position: 0, text: '0%' },
            { position: 25 },
            { position: 50, text: '50%' },
            { position: 75 },
            { position: 100, text: '100%' },
          ]}
        />
      </div>

      <Uik.Button
        className="uik-pool-actions__cta"
        fill
        icon={faRepeat}
        text={isLoading ? status : 'Trade'}
        size="large"
        loading={isLoading}
        disabled={!isValid || isLoading}
        onClick={() => setPopupOpen(true)}
      />

      <TradePopup
        isOpen={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        onConfirm={onSwap}
        token1={token1}
        token2={token2}
        slippage={slippage}
        exchangeRate={rate}
      />
    </div>
  );
};

export default Trade;
