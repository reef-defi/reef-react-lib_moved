import React from "react"

export const FlexRow: React.FC<unknown> = ({children}): JSX.Element => (
  <div className="d-flex flex-row">
    {children}
  </div>
);

export const FlexColumn: React.FC<unknown> = ({children}): JSX.Element => (
  <div className="d-flex flex-column">
    {children}
  </div>
);

