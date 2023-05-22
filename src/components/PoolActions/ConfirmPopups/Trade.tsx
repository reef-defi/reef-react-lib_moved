import React, { useMemo } from 'react';
import Uik from '@reef-chain/ui-kit';
import SummaryItem from './SummaryItem';
import Token from './Token';
import { TokenWithAmount } from '../../../state';
import './confirm-popup.css';
import { calculateUsdAmount, minimumReceiveAmount } from '../../../utils/math';

export interface TradePopup {
  fee: string;
  isOpen: boolean
  slippage: number,
  exchangeRate?: string
  token1: TokenWithAmount
  token2: TokenWithAmount
  onClose: (...args: any[]) => any
  onConfirm?: (...args: any[]) => any
}

const TradePopup = ({
  fee,
  isOpen,
  token1,
  token2,
  slippage,
  exchangeRate,
  onClose,
  onConfirm,
}: TradePopup): JSX.Element => {
  const tokens = useMemo(() => ({
    token1: {
      iconUrl: token1.iconUrl,
      symbol: token1.symbol,
      price: Uik.utils.maxDecimals(token1.price, 4),
      amount: token1.amount,
      value: Uik.utils.maxDecimals(calculateUsdAmount(token1), 2),
    },
    token2: {
      iconUrl: token2.iconUrl,
      symbol: token2.symbol,
      price: Uik.utils.maxDecimals(token2.price, 4),
      amount: token2.amount,
      value: Uik.utils.maxDecimals(calculateUsdAmount(token2), 2),
    },
  }), [token1, token2]);

  return (
    <Uik.Modal
      className="confirm-popup"
      title="Confirm Trade"
      isOpen={isOpen}
      onClose={onClose}
      footer={(
        <Uik.Button
          text="Confirm Trade"
          fill
          size="large"
          onClick={() => {
            if (onConfirm) onConfirm();
            if (onClose) onClose();
          }}
        />
    )}
    >
      <div className="confirm-popup__container">
        <Uik.Text type="mini">You are trading from</Uik.Text>

        <Token
          image={tokens.token1.iconUrl}
          symbol={tokens.token1.symbol}
          price={tokens.token1.price}
          amount={tokens.token1.amount}
          value={tokens.token1.value}
        />

        <Uik.Text type="mini">You are trading to</Uik.Text>

        <Token
          image={tokens.token2.iconUrl}
          symbol={tokens.token2.symbol}
          price={tokens.token2.price}
          amount={tokens.token2.amount}
          value={tokens.token2.value}
        />

        <Uik.Text type="mini">Other information</Uik.Text>

        <div className="confirm-popup-summary">
          <SummaryItem
            label="Fee"
            value={fee}
          />
          <SummaryItem
            label="Route"
            value={`${token1.symbol} ➔ ${token2.symbol}`}
          />
          <SummaryItem
            label="Exchange Rate"
            value={exchangeRate || ''}
          />
          <SummaryItem
            label="Slippage Tolerance"
            value={`${slippage.toFixed(2)}%`}
          />
          <SummaryItem
            label="Minimum Received"
            value={`${Uik.utils.maxDecimals(minimumReceiveAmount(token2, slippage), 4)} ${token2.symbol}`}
          />
        </div>
      </div>
    </Uik.Modal>
  );
};

export default TradePopup;
