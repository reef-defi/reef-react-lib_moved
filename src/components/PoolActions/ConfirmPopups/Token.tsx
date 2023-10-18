import React from 'react';
import './confirm-popup.css';
import { toHumanAmount } from '../../../utils/math';

export interface Props {
  image?: string,
  symbol?: string,
  price?: string | number,
  amount?: string | number,
  value?: string | number,
  className?: string
}

const Token = ({
  image,
  symbol,
  price,
  amount,
  value,
  className,
}: Props): JSX.Element => (
  <div
    className={`
      confirm-popup-token
      ${className || ''}
    `}
  >
    <div className="confirm-popup-token__token">
      <div
        className="confirm-popup-token__image"
        style={{
          backgroundImage: `url(${image})`,
        }}
      />

      <div className="confirm-popup-token__info">
        <div className="confirm-popup-token__symbol">{ symbol }</div>
        <div className="confirm-popup-token__price">
          Price: $
          { Number.isNaN(price) ? 0 : price }
        </div>
      </div>
    </div>

    <div className="confirm-popup-token__amount-wrapper">
      <div className="confirm-popup-token__value">
        $
        { value }
      </div>
      <div className="confirm-popup-token__amount">{ amount ? toHumanAmount(amount.toString()) : '0' }</div>
    </div>
  </div>
);

export default Token;
