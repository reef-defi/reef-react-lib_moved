import React from 'react';

export const List: React.FC<unknown> = ({ children }): JSX.Element => (
  <ul className="list-group list-group-flush list-group-full px-0">
    {children}
  </ul>
);

export const ListItem: React.FC<unknown> = ({ children }): JSX.Element => (
  <li className="list-group-item list-group-item-action d-flex justify-content-between">
    {children}
  </li>
);
export const ListEmptyItem = (): JSX.Element => (
  <li className="list-group-item px-2" />
);
