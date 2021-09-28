import React from 'react';

export const Title: React.FC<unknown> = ({children}): JSX.Element => (
  <h5 className="title-text user-select-none">
    {children}
  </h5>
)

export const LeadText: React.FC<unknown> = ({children}): JSX.Element => (
  <span className="title-text user-select-none">
    {children}
  </span>
);

export const Text: React.FC<unknown> = ({children}): JSX.Element => (
  <span className="user-select-none">
    {children}
  </span>
);

export const MiniText: React.FC<unknown> = ({children}): JSX.Element => (
  <span className="mini-text user-select-none">
    {children}
  </span>
);
