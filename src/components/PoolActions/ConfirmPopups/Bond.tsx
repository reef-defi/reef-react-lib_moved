import React from 'react';
import Uik from '@reef-chain/ui-kit';
import SummaryItem from './SummaryItem';
import './confirm-popup.css';

export interface Props {
  isOpen: boolean
  onClose: (...args: any[]) => any
  onConfirm?: (...args: any[]) => any
  name?: string
  amount?: string
  contract?: string
  duration?: string
}

export const BondConfirmPopup = ({
  isOpen,
  onClose,
  onConfirm,
  name,
  amount,
  contract,
  duration,
}: Props): JSX.Element => (
  <Uik.Modal
    className="confirm-popup"
    title="Confirm Staking"
    isOpen={isOpen}
    onClose={onClose}
    footer={(
      <Uik.Button
        text="Confirm Staking"
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
      <div className="confirm-popup-summary">
        <SummaryItem
          label="Bond name"
          value={name}
        />
        <SummaryItem
          label="Stake amount"
          value={amount}
        />
        <SummaryItem
          label="Contract"
          value={contract}
        />
        <SummaryItem
          label="Staking duration"
          value={duration}
        />
      </div>
    </div>
  </Uik.Modal>
);
