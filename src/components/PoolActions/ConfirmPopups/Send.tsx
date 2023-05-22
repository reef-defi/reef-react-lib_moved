import React, { useMemo } from 'react';
import Uik from '@reef-chain/ui-kit';
import Token from './Token';
import { TokenWithAmount } from '../../../state';
import './confirm-popup.css';
import { calculateUsdAmount } from '../../../utils/math';
import Address from './Address';

export interface SendPopup {
  isOpen: boolean
  token: TokenWithAmount
  address?: string
  onClose: (...args: any[]) => any
  onConfirm?: (...args: any[]) => any
}

const SendPopup = ({
  isOpen,
  token,
  address,
  onClose,
  onConfirm,
}: SendPopup): JSX.Element => {
  const getToken = useMemo(() => ({
    iconUrl: token.iconUrl,
    symbol: token.symbol,
    price: Uik.utils.maxDecimals(token.price, 4),
    amount: token.amount,
    value: Uik.utils.maxDecimals(calculateUsdAmount(token), 2),
  }), [token]);

  return (
    <Uik.Modal
      className="confirm-popup"
      title="Send Tokens"
      isOpen={isOpen}
      onClose={onClose}
      footer={(
        <Uik.Button
          text="Send Tokens"
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
        <Uik.Text type="mini">You are sending</Uik.Text>

        <Token
          image={getToken.iconUrl}
          symbol={getToken.symbol}
          price={getToken.price}
          amount={getToken.amount}
          value={getToken.value}
        />

        <Uik.Text type="mini">You are sending to</Uik.Text>

        <Address address={address || ''} />
      </div>
    </Uik.Modal>
  );
};

export default SendPopup;
