import Uik from '@reef-chain/ui-kit';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { Pool } from '../../../state';
import { showRemovePoolTokenShare } from '../../../utils';
import './confirm-popup.css';
import SummaryItem from './SummaryItem';
import Token from './Token';

export interface Props {
  pool: Pool;
  price1: number;
  price2: number;
  percentageAmount: number
  isOpen: boolean
  LPTokens: string | number
  poolShare: string
  onClose: (...args: any[]) => any
  onConfirm?: (...args: any[]) => any
}

const WithdrawPopup = ({
  price1,
  price2,
  pool,
  isOpen,
  LPTokens,
  poolShare,
  percentageAmount,
  onClose,
  onConfirm,
}: Props): JSX.Element => {
  const tokens = useMemo(() => {
    let amount1 = new BigNumber(showRemovePoolTokenShare(percentageAmount, pool.token1)).toNumber();
    if (isNaN(amount1)) amount1 = 0;
    let amount2 = new BigNumber(showRemovePoolTokenShare(percentageAmount, pool.token2)).toNumber();
    if (isNaN(amount2)) amount2 = 0;

    let value1 = Uik.utils.maxDecimals(new BigNumber(price1).times(amount1).toNumber(), 2);
    if (isNaN(value1)) value1 = 0;
    let value2 = Uik.utils.maxDecimals(new BigNumber(price2).times(amount2).toNumber(), 2);
    if (isNaN(value2)) value2 = 0;

    return {
      token1: {
        iconUrl: pool.token1.iconUrl,
        symbol: pool.token1.symbol,
        price: Uik.utils.maxDecimals(price1, 4),
        amount: amount1,
        value: value1,
      },
      token2: {
        iconUrl: pool.token2.iconUrl,
        symbol: pool.token2.symbol,
        price: Uik.utils.maxDecimals(price2, 4),
        amount: amount2,
        value: value2,
      },
    };
  }, [percentageAmount, pool, price1, price2]);

  const getLPTokens = useMemo(() => {
    const value = Uik.utils.maxDecimals(LPTokens, 4);
    if (isNaN(value)) return 0;
    return value;
  }, [LPTokens]);

  const getPoolShare = useMemo(() => {
    const value = Uik.utils.maxDecimals(poolShare.replaceAll('%', ''), 4);
    if (isNaN(value)) return '0%';
    return `${value}%`;
  }, [poolShare]);

  return (
    <Uik.Modal
      className="confirm-popup"
      title="Confirm Withdraw Liquidity"
      isOpen={isOpen}
      onClose={onClose}
      footer={(
        <Uik.Button
          text="Confirm Withdraw"
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
        <Uik.Text type="mini">You will receive</Uik.Text>

        <Token
          image={tokens.token1.iconUrl}
          symbol={tokens.token1.symbol}
          price={tokens.token1.price}
          amount={tokens.token1.amount}
          value={tokens.token1.value}
        />

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
            value="1.5 REEF"
          />
          <SummaryItem
            label="LP Tokens"
            value={getLPTokens}
          />
          <SummaryItem
            label="Share of Pool"
            value={getPoolShare}
          />
        </div>

        <Uik.Text type="mini">
          Output is estimated. If the price changes by more than 0% your transaction will revert.
        </Uik.Text>
      </div>
    </Uik.Modal>
  );
};

export default WithdrawPopup;
