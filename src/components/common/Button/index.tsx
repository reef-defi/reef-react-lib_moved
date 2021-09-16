import React from 'react'
import { Link } from 'react-router-dom'
import { BackIcon, DownArrowIcon, PlusIcon } from '../Icons'

interface NavProps {
  to: string
  selected: boolean
}

interface ButtonProps {
  onClick?: () => void
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick = () => {}
}): JSX.Element => (
  <button type='button' className='btn btn-reef' onClick={onClick}>
    {children}
  </button>
)

export const Empty: React.FC<ButtonProps> = ({
  children,
  onClick = () => {}
}): JSX.Element => (
  <button type='button' className='btn' onClick={onClick}>
    {children}
  </button>
)

export const Nav: React.FC<NavProps> = ({
  to,
  children,
  selected = false
}): JSX.Element => (
  <Link
    to={to}
    className={`border-rad h-100 fs-6 fw-bold px-3 py-2 ${
      selected ? 'nav-selected' : 'nav-button'
    }`}
  >
    {children}
  </Link>
)

// TODO maybe we do not need this one?
export const Back = ({ onClick }: ButtonProps): JSX.Element => (
  <Empty onClick={onClick}>
    <BackIcon />
  </Empty>
)

// TODO Move out or refactore!
interface SwitchTokenButton {
  addIcon?: boolean
  disabled?: boolean
  onClick?: () => void
}

interface IconButton {
  onClick?: () => void
}

export const SwitchToken = ({
  addIcon,
  disabled,
  onClick
}: SwitchTokenButton): JSX.Element => (
  <div className='d-flex justify-content-center'>
    <div className='btn-content-field border-rad'>
      <button
        type='button'
        className='btn btn-field border-rad hover-border'
        onClick={onClick}
        disabled={disabled}
      >
        {addIcon ? <PlusIcon /> : <DownArrowIcon />}
      </button>
    </div>
  </div>
)

export const Icon: React.FC<IconButton> = ({
  onClick,
  children
}): JSX.Element => (
  <button
    type='button'
    className='btn btn-select border-rad px-2 py-1'
    onClick={onClick}
    data-bs-dismiss='modal'
  >
    {children}
  </button>
)
