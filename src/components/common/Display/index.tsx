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

export const CenterRow: React.FC<unknown> = ({children}): JSX.Element => (
  <div className="my-auto">
    {children}
  </div>
);

export const CenterColumn: React.FC<unknown> = ({children}): JSX.Element => (
  <div className="mx-auto">
    {children}
  </div>
)

interface Size {
  size?: "1" | "2" | "3" | "4" | "5" | "6";
}

export const Margin: React.FC<Size> = ({children, size="1"}): JSX.Element => (
  <div className={`m-${size}`}>
    {children}
  </div>
);
