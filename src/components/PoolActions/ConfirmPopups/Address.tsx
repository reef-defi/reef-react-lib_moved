import React from 'react';
import Identicon from '@polkadot/react-identicon';
import './confirm-popup.css';

export interface Props {
  address: string
  className?: string
}

const Address = ({
  address,
  className,
}: Props): JSX.Element => (
  <div
    className={`
      confirm-popup-address
      confirm-popup-token
      ${className || ''}
    `}
  >
    <div className="confirm-popup-token__image confirm-popup-address__image">
      <Identicon className="confirm-popup-address__identicon" value={address} size={46} theme="substrate" />
    </div>

    <div className="confirm-popup-address__address">{ `${address.substr(0, 10)} ... ${address.substr(address.length - 10)}` }</div>
  </div>
);

export default Address;
