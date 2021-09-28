import React from 'react';

interface Input {
  value?: string
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const Input = ({value, disabled, maxLength, placeholder, onChange}: Input): JSX.Element => (
  <input
    value={value}
    disabled={disabled}
    maxLength={maxLength}
    placeholder={placeholder}
    className="form-control form-control-lg border-rad"
    onChange={(event) => onChange(event.target.value)}

  />
);

interface InputAmount {
  amount: string;
  disabled?: boolean;
  placeholder?: string;
  onAmountChange: (value: string) => void;
}

export const InputAmount = ({
  amount,
  onAmountChange,
  placeholder = '',
  disabled = false,
}: InputAmount): JSX.Element => (
  <input
    type="number"
    min={0.0}
    disabled={disabled}
    value={disabled ? '' : amount.replaceAll(',', '.')}
    placeholder={placeholder}
    className="field-input ms-2 flex-grow-1 text-end"
    onChange={(event) => onAmountChange(event.target.value)}
  />
);

