import React from 'react';

interface ListItem {
  onClick?: () => void;
}

export const List: React.FC<unknown> = ({ children }): JSX.Element => (
  <ul className="list-group list-group-flush list-group-full px-0 border-rad">
    {children}
  </ul>
);

export const ListItem: React.FC<ListItem> = ({
  children,
  onClick,
}): JSX.Element => (
  <li
    onClick={onClick}
    className={`list-group-item d-flex justify-content-between border-rad ${
      !!onClick && 'pointer'
    }`}
  >
    {children}
  </li>
);

export const ListItemDismissModal: React.FC<ListItem> = ({
  children,
  onClick,
}): JSX.Element => (
  <li
    onClick={onClick}
    data-bs-dismiss="modal"
    className={`list-group-item list-group-item-action d-flex justify-content-between border-rad ${
      onClick && 'pointer'
    }`}
  >
    {children}
  </li>
);

export const ListItemActionModal: React.FC<ListItem> = ({
  children,
  onClick,
}): JSX.Element => (
  <li
    onClick={onClick}
    className={`list-group-item list-group-item-action d-flex justify-content-between border-rad ${
      onClick && 'pointer'
    }`}
  >
    {children}
  </li>
);

export const ListEmptyItem = (): JSX.Element => (
  <li className="list-group-item px-2" />
);
