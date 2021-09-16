import React from 'react'

interface DropdownProps {
  id?: string
}

interface ListLinkItemProps {
  href: string
  name: string // TODO maybe about?
}

export const Dropdown: React.FC<{}> = ({ children }): JSX.Element => (
  <div className='dropdown'>{children}</div>
)

export const List: React.FC<DropdownProps> = ({
  children,
  id = 'dropdownMenuButton1'
}) => (
  <ul
    className='dropdown-menu dropdown-menu-end border-rad m-1'
    aria-labelledby={id}
  >
    {children}
  </ul>
)

export const ListLinkItem: React.FC<ListLinkItemProps> = ({
  name,
  href,
  children
}) => (
  <li>
    <a className='dropdown-item' href={href} target='_blank' rel='noreferrer'>
      {children}
      <span className='ms-3 lead-text'>{name}</span>
    </a>
  </li>
)
