import React from 'react';
import Uik from '@reef-defi/ui-kit';
import SummaryItem from './SummaryItem';
import Token from './Token';
import './confirm-popup.css';

export interface Props {
  isOpen: boolean
  onClose: (...args: any[]) => any
  onConfirm?: (...args: any[]) => any
}

const WithdrawPopup = ({
  isOpen,
  onClose,
  onConfirm,
}: Props): JSX.Element => (
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
        image="https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png"
        symbol="REEF"
        price={0.05}
        amount={1000}
        value={50}
      />

      <Token
        image="https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png"
        symbol="REEF"
        price={0.05}
        amount={1000}
        value={50}
      />

      <Uik.Text type="mini">Other information</Uik.Text>

      <div className="confirm-popup-summary">
        <SummaryItem
          label="Fee"
          value="1.5 REEF"
        />
        <SummaryItem
          label="LP Tokens"
          value="4.87654"
        />
        <SummaryItem
          label="Share of Pool"
          value="25%"
        />
      </div>

      <Uik.Text type="mini">
        Output is estimated. If the price changes by more than 0% your transaction will revert.
      </Uik.Text>
    </div>
  </Uik.Modal>
);

export default WithdrawPopup;
