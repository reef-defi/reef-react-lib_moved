import Uik from '@reef-defi/ui-kit';
import BigNumber from 'bignumber.js';
import React, { useMemo, useState } from 'react';
import { Token, TokenWithAmount } from '../../state';
import { showBalance } from '../../utils/math';
import './token-field.css';

export type SelectToken = (token: Token) => void

BigNumber.config({EXPONENTIAL_AT: 1000})

interface TokenField {
  token: TokenWithAmount;
  tokens?: Token[];
  selectToken?: SelectToken;
  onAmountChange: (amount: string) => void;
}

const TokenField = ({
  token,
  // tokens=[],
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
      return '$0.0'
    } else {
      return `$${Uik.utils.formatAmount(formatNum)}`;
    }
  }, [token.amount, token.price]);

  return (
    <div
      className={`
        uik-pool-actions-token
        ${isFocused ? 'uik-pool-actions-token--focused' : isFocused}
      `}
    >

      <button
        className={!token.isEmpty
          ? "uik-pool-actions-token__token"
          : "uik-pool-actions-token uik-pool-actions-token--select"
        }
        type="button"
        disabled={!selectToken}
        // onClick={selectToken}
      >
        <div
          className="uik-pool-actions-token__image"
          style={{
            backgroundImage: `url(${token.iconUrl})`,
          }}
        />

        <div className="uik-pool-actions-token__info">
          <div className="uik-pool-actions-token__symbol">{ token.symbol }</div>
          { !token.isEmpty &&
            <div className="uik-pool-actions-token__amount">
              Available
              {' '}
              { showBalance(token) }
            </div>
          }
        </div>
      </button>
      { !token.isEmpty &&
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
      }
    </div>
  );
};

export default TokenField;
