import React, { useState, useMemo, useEffect } from 'react';
import Uik from '@reef-defi/ui-kit';
import BigNumber from 'bignumber.js';
import { TokenWithAmount } from '../../state';
import { showBalance } from '../../utils/math';

interface Props {
  token: TokenWithAmount,
  onAmountChange: (amount: string) => void
}

const TokenField = ({
  token,
  onAmountChange,
}: Props): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amo = parseFloat(amount);

  const [isFocused, setFocused] = useState(false);
  const onInputFocus = (): void => setFocused(true);
  const onInputBlur = (): void => setFocused(false);

  const getPrice = useMemo((): number => Uik.utils.maxDecimals(new BigNumber(amo || 0).times(price || 0).toNumber(), 2), [amo, price]);

  const mathDecimals = !amount ? '' : amount.replaceAll(',', '.');
  const [inputValue, setInputValue] = useState(mathDecimals);
  useEffect(() => setInputValue(amount), [amount]);

  const handleInputChange = (event: any): void => {
    const newVal = event.target.value;
    setInputValue(newVal);
    onAmountChange(newVal);
  };

  return (
    <div
      className={`
        uik-pool-actions-token
        ${isFocused ? 'uik-pool-actions-token--focused' : isFocused}
      `}
    >

      <div className="uik-pool-actions-token__token">
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
            {" "}
            { showBalance(token) }
          </div>
        </div>
      </div>

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
            $
            { getPrice ? Uik.utils.formatAmount(getPrice) : '0.0' }
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
