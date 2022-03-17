import React, { BaseSyntheticEvent, useEffect, useState } from 'react';

interface Input {
  value?: string;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
}

export const Input = ({
  value,
  disabled,
  maxLength,
  placeholder,
  className = '',
  onChange = (_) => {},
}: Input): JSX.Element => (
  <input
    value={value}
    disabled={disabled}
    maxLength={maxLength}
    placeholder={placeholder}
    className={`form-control form-control-lg border-rad ${className}`}
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
}: InputAmount): JSX.Element => {
  const mathDecimals = !amount ? '' : amount.replaceAll(',', '.');
  const [amt, setAmt] = useState(mathDecimals);
  useEffect(() => setAmt(amount), [amount]);
  const inputChange = (event: any): void => {
    const newVal = event.target.value;
    setAmt(newVal);
    onAmountChange(newVal);
  };
  return (
    <input
      type="number"
      min={0.0}
      disabled={disabled}
      value={amt}
      placeholder={placeholder}
      className="field-input ms-2 flex-grow-1 text-end"
      onChange={inputChange}
    />
  );
};

export const InputGroup: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="input-group">{children}</div>
);

export const InputTextGroup: React.FC<unknown> = ({
  children,
}): JSX.Element => (
  <div className="input-group-text field-input border-rad ps-1">{children}</div>
);

interface NumberInput {
  min?: number;
  max?: number;
  step?: number;
  value: string;
  className?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disableDecimals?: boolean;
}

export const NumberInput = ({
  value,
  min,
  max,
  step,
  placeholder,
  onChange,
  disableDecimals,
  className = '',
}: NumberInput): JSX.Element => {
  const keyDown = (e: BaseSyntheticEvent): void => {
    if (!disableDecimals) {
      return;
    }
    if (
      (e.nativeEvent as KeyboardEvent).key === '.'
      || (e.nativeEvent as KeyboardEvent).key === ','
    ) {
      e.preventDefault();
      (e.nativeEvent as any).stopImmediatePropagation();
    }
  };

  return (
    <input
      min={min}
      max={max}
      step={step}
      type="number"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={keyDown}
      className={className || 'form-control field-input border-rad text-end'}
    />
  );
};

interface PercentageRangeAmount {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const PercentageRangeAmount = ({
  value,
  disabled,
  onChange,
}: PercentageRangeAmount): JSX.Element => (
  <input
    min={0}
    max={100}
    type="range"
    className="form-range"
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(parseInt(event.target.value, 10))}
  />
);

interface CheckboxInput {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: any) => void;
  id: string;
  labelText?: string;
}

export const CheckboxInput = ({
  checked,
  disabled,
  onChange,
  id,
  labelText,
}: CheckboxInput): JSX.Element => (
  <div className="form-check">
    <input
      className="form-check-input"
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event)}
      disabled={disabled}
    />
    <label htmlFor={id} className="form-check-label">
      {labelText}
    </label>
  </div>
);
