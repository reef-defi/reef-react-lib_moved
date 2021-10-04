import React from 'react';

interface Input {
  value?: string
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Input = ({
  value, disabled, maxLength, placeholder, onChange = (_) => {},
}: Input): JSX.Element => (
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

export const InputGroup: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="input-group">
    {children}
  </div>
);

export const InputTextGroup: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="input-group-text field-input border-rad ps-1">
    {children}
  </div>
);

interface NumberInput {
  min?: number;
  max?: number;
  step?: number;
  value: string;
  className?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const NumberInput = ({
  value, min, max, step, placeholder, onChange, className = '',
}: NumberInput): JSX.Element => (
  <input
    min={min}
    max={max}
    step={step}
    type="number"
    value={value}
    placeholder={placeholder}
    onChange={(event) => onChange(event.target.value)}
    className={`form-control field-input border-rad text-end ${className}`}
  />
);
