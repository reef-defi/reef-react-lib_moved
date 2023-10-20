import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import Uik from '@reef-chain/ui-kit';
import SummaryItem from './SummaryItem';
import Token from './Token';
import { TokenWithAmount } from '../../../state';
import './confirm-popup.css';

export interface Props {
  isOpen: boolean
  onClose: (...args: any[]) => any
  onConfirm?: (...args: any[]) => any
  token1: TokenWithAmount
  token2: TokenWithAmount
  poolShare: string
  percentage: number
  LPTokens: string | number
}

const ProvidePopup = ({
  isOpen,
  onClose,
  onConfirm,
  token1,
  token2,
  poolShare,
  percentage,
  LPTokens,
}: Props): JSX.Element => {
  const tokens = useMemo(() => {
    let value1 = Uik.utils.maxDecimals(new BigNumber(token1.price).times(token1.amount).toNumber(), 2);
    if (isNaN(value1)) value1 = 0;
    let value2 = Uik.utils.maxDecimals(new BigNumber(token2.price).times(token2.amount).toNumber(), 2);
    if (isNaN(value2)) value2 = 0;

    return {
      token1: {
        iconUrl: token1.iconUrl,
        symbol: token1.symbol,
        price: Uik.utils.maxDecimals(token1.price, 4),
        amount: token1.amount,
        value: value1,
      },
      token2: {
        iconUrl: token2.iconUrl,
        symbol: token2.symbol,
        price: Uik.utils.maxDecimals(token2.price, 4),
        amount: token2.amount,
        value: value2,
      },
    };
  }, [token1, token2]);

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
      title="Confirm Providing Liquidity"
      isOpen={isOpen}
      onClose={onClose}
      footer={(
        <Uik.Button
          text="Confirm Provide"
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
        <Uik.Text type="mini">You will provide</Uik.Text>

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
          Output is estimated. If the price changes
          {
            !!percentage && percentage !== Infinity
            && ` by more than ${percentage}% `
          }
          your transaction will revert.
        </Uik.Text>
      </div>
    </Uik.Modal>
  );
};

export default ProvidePopup;
