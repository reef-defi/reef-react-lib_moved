import React from 'react';

export interface Props {
  label?: string
  value?: string | number
  className?: string
}

const SummaryItem = ({
  label,
  value,
  className,
}: Props): JSX.Element => (
  <div
    className={`
      confirm-popup-summary-item
      ${className || ''}
    `}
  >
    <div className="confirm-popup-summary-item-label">{ label }</div>
    <div className="confirm-popup-summary-item-value">{ value }</div>
  </div>
);

export default SummaryItem;
