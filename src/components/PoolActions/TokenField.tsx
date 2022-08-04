import React, { useState, useMemo, useEffect } from 'react';
import Uik from '@reef-defi/ui-kit';
import BigNumber from 'bignumber.js';
import { TokenWithAmount } from '../../state';
import { showBalance } from '../../utils/math';
import './token-field.css';

export type SelectToken = () => void

interface Props {
  token: TokenWithAmount,
  onAmountChange: (amount: string) => void,
  selectToken?: SelectToken
}

const TokenField = ({
  token,
  onAmountChange,
  selectToken,
}: Props): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amo = parseFloat(amount);

  const [isFocused, setFocused] = useState(false);
  const onInputFocus = (): void => setFocused(true);
  const onInputBlur = (): void => setFocused(false);

  const getPrice = useMemo((): string => {
    const num = new BigNumber(amo || 0).times(price || 0).toNumber();
    const formatNum = Uik.utils.maxDecimals(num, 2);
    if (formatNum) return `$${Uik.utils.formatAmount(formatNum)}`;
    if (num) return '$0.0';
    return '';
  }, [amo, price]);

  const mathDecimals = !amount ? '' : amount.replaceAll(',', '.');
  const [inputValue, setInputValue] = useState(mathDecimals);
  useEffect(() => setInputValue(amount), [amount]);

  const handleInputChange = (event: any): void => {
    const newVal = event.target.value;
    setInputValue(newVal);
    onAmountChange(newVal);
  };

  const isSelected = useMemo(() => token.symbol !== 'Select token', [token.symbol]);

  if (!isSelected) {
    return (
      <button
        className={`
        uik-pool-actions-token
        uik-pool-actions-token--select
      `}
        type="button"
        onClick={selectToken}
      >
        Select token
      </button>
    );
  }

  return (
    <div
      className={`
        uik-pool-actions-token
        ${isFocused ? 'uik-pool-actions-token--focused' : isFocused}
      `}
    >

      <button
        className="uik-pool-actions-token__token"
        type="button"
        disabled={!selectToken}
        onClick={selectToken}
      >
        <div
          className="uik-pool-actions-token__image"
          style={{
            backgroundImage: `url(${token.iconUrl})`,
          }}
        />

        <div className="uik-pool-actions-token__info">
          <div className="uik-pool-actions-token__symbol">{ token.symbol }</div>
          <div className="uik-pool-actions-token__amount">
            Available
            {' '}
            { showBalance(token) }
          </div>
        </div>
      </button>

      <div className="uik-pool-actions-token__value">
        {
          !!price
          && (
          <div
            className={`
              uik-pool-actions-token__price
              ${!getPrice ? 'uik-pool-actions-token__price--empty' : ''}
            `}
          >
            { getPrice }
          </div>
          )
        }

        <input
          type="number"
          min={0.0}
          disabled={isEmpty}
          value={inputValue}
          onBlur={onInputBlur}
          onFocus={onInputFocus}
          size={1}
          placeholder="0.0"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};

export default TokenField;
