import React from 'react';
import { BackIcon, DownArrowIcon, PlusIcon } from '../Icons';

interface ButtonProps {
  onClick?: () => void;
}

export interface ButtonStatus {
  text: string;
  isValid: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick = () => {},
}): JSX.Element => (
  <button type="button" className="btn btn-reef border-rad" onClick={onClick} data-bs-dismiss="modal">
    {children}
  </button>
);

export const EmptyButton: React.FC<ButtonProps> = ({
  children,
  onClick = () => {},
}): JSX.Element => (
  <button type="button" className="btn" onClick={onClick}>
    {children}
  </button>
);

// TODO maybe we do not need this one?
export const BackButton = ({ onClick }: ButtonProps): JSX.Element => (
  <EmptyButton onClick={onClick}>
    <BackIcon />
  </EmptyButton>
);

// TODO Move out or refactore!
interface SwitchTokenButton {
  addIcon?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface IconButton {
  onClick?: () => void;
}

export const SwitchToken = ({
  addIcon,
  disabled,
  onClick,
}: SwitchTokenButton): JSX.Element => (
  <div className="d-flex justify-content-center">
    <div className="btn-content-field border-rad">
      <button
        type="button"
        className="btn btn-field border-rad hover-border"
        onClick={onClick}
        disabled={disabled}
      >
        {addIcon ? <PlusIcon /> : <DownArrowIcon />}
      </button>
    </div>
  </div>
);

export const IconButton: React.FC<IconButton> = ({
  onClick,
  children,
}): JSX.Element => (
  <button
    type="button"
    className="btn btn-select border-rad px-2 py-1"
    onClick={onClick}
    data-bs-dismiss="modal"
  >
    {children}
  </button>
);
