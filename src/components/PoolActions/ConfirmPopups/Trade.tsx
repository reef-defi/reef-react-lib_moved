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

const TradePopup = ({
  isOpen,
  onClose,
  onConfirm,
}: Props): JSX.Element => (
  <Uik.Modal
    className="confirm-popup"
    title="Confirm Trade"
    isOpen={isOpen}
    onClose={onClose}
    footer={(
      <Uik.Button
        text="Confirm Trade"
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
      <Uik.Text type="mini">You are trading from</Uik.Text>

      <Token
        image="https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png"
        symbol="REEF"
        price={0.05}
        amount={1000}
        value={50}
      />

      <Uik.Text type="mini">You are trading to</Uik.Text>

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
          label="Route"
          value="REEF > REEF"
        />
        <SummaryItem
          label="Exchange Rate"
          value="1 REEF = 1 REEF"
        />
        <SummaryItem
          label="Slippage Tolerance"
          value="0.5%"
        />
        <SummaryItem
          label="Minimum Received"
          value="0.123 REEF"
        />
      </div>
    </div>
  </Uik.Modal>
);

export default TradePopup;
