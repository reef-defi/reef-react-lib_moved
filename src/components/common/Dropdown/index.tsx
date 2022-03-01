import React from 'react';
import { Margin } from '../Display';

interface Dropdown {
  id?: string;
}

export const Dropdown: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="dropdown">{children}</div>
);

export const DropdownButton: React.FC<Dropdown> = ({
  children,
  id = 'dropdown-button',
}): JSX.Element => (
  <button
    id={id}
    className="btn"
    type="button"
    data-bs-toggle="dropdown"
    data-bs-auto-close="outside"
    aria-expanded="false"
  >
    {children}
  </button>
);

interface DropdownMenu extends Dropdown {
  size?: string;
}

export const DropdownMenu: React.FC<DropdownMenu> = ({
  children,
  id = 'dropdown-button',
  size = 'auto',
}): JSX.Element => (
  <div
    className="dropdown-menu dropdown-menu-end border-rad"
    aria-label={id}
    style={{ minWidth: size }}
  >
    <Margin size="3">{children}</Margin>
  </div>
);
