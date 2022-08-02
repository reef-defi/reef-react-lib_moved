import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import Uik from '@reef-defi/ui-kit';
import SummaryItem from './SummaryItem';
import Token from './Token';
import { TokenWithAmount } from '../../../state';
import './confirm-popup.css';
import { showRemovePoolTokenShare } from '../../../utils';

export interface Props {
  percentageAmount: number
  token1: TokenWithAmount
  token2: TokenWithAmount
  isOpen: boolean
  LPTokens: string | number
  poolShare: string
  onClose: (...args: any[]) => any
  onConfirm?: (...args: any[]) => any
}

const WithdrawPopup = ({
  percentageAmount,
  token1,
  token2,
  isOpen,
  LPTokens,
  poolShare,
  onClose,
  onConfirm,
}: Props): JSX.Element => {
  const tokens = useMemo(() => {
    let amount1 = showRemovePoolTokenShare(percentageAmount, token1);
    if (isNaN(amount1)) amount1 = 0;
    let amount2 = showRemovePoolTokenShare(percentageAmount, token2);
    if (isNaN(amount2)) amount2 = 0;

    let value1 = Uik.utils.maxDecimals(new BigNumber(token1.price).times(amount1).toNumber(), 2);
    if (isNaN(value1)) value1 = 0;
    let value2 = Uik.utils.maxDecimals(new BigNumber(token2.price).times(amount2).toNumber(), 2);
    if (isNaN(value2)) value2 = 0;

    return {
      token1: {
        iconUrl: token1.iconUrl,
        symbol: token1.symbol,
        price: Uik.utils.maxDecimals(token1.price, 4),
        amount: amount1,
        value: value1,
      },
      token2: {
        iconUrl: token2.iconUrl,
        symbol: token2.symbol,
        price: Uik.utils.maxDecimals(token2.price, 4),
        amount: amount2,
        value: value2,
      },
    };
  }, [percentageAmount, token1, token2]);

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
