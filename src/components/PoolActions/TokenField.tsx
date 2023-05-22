import Uik from '@reef-chain/ui-kit';
import BigNumber from 'bignumber.js';
import React, { useMemo, useState } from 'react';
import { Token, TokenWithAmount } from '../../state';
import './token-field.css';
import TokenDropdown from './TokenDropdown';

export type SelectToken = (token: Token) => void

BigNumber.config({ EXPONENTIAL_AT: 1000 });

interface TokenField {
  token: TokenWithAmount;
  tokens?: Token[];
  selectToken?: SelectToken;
  onAmountChange: (amount: string) => void;
}

const TokenField = ({
  token,
  tokens = [],
  onAmountChange,
  selectToken,
}: TokenField): JSX.Element => {
  const [isFocused, setFocused] = useState(false);
  const onInputFocus = (): void => setFocused(true);
  const onInputBlur = (): void => setFocused(false);

  const price = useMemo((): string => {
    if (token.amount === '') {
      return '';
    }
    const num = new BigNumber(token.amount)
      .multipliedBy(token.price)
      .toString();
    const formatNum = Uik.utils.maxDecimals(num, 2);
    if (!formatNum) {
      return '$0.0';
    }
    return `$${Uik.utils.formatAmount(formatNum)}`;
  }, [token.amount, token.price]);

  return (
    <div
      className={`
        uik-pool-actions-token
        ${isFocused ? 'uik-pool-actions-token--focused' : isFocused}
      `}
    >
      <TokenDropdown
        token={token}
        tokens={tokens}
        selectToken={selectToken}
      />
      { !token.isEmpty
        && (
        <div className="uik-pool-actions-token__value">
          {
            !!price
            && (
            <div
              className={`
                uik-pool-actions-token__price
                ${!price ? 'uik-pool-actions-token__price--empty' : ''}
              `}
            >
              { price }
            </div>
            )
          }

          <input
            type="number"
            min={0.0}
            disabled={token.isEmpty}
            value={token.amount}
            onBlur={onInputBlur}
            onFocus={onInputFocus}
            size={1}
            placeholder="0.0"
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </div>
        )}
    </div>
  );
};

export default TokenField;
