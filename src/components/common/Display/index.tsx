import React from 'react';

export const FlexRow: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="d-flex flex-row">
    {children}
  </div>
);

export const FlexColumn: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="d-flex flex-column">
    {children}
  </div>
);

export const CenterRow: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="my-auto">
    {children}
  </div>
);

export const CenterColumn: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="mx-auto">
    {children}
  </div>
);

export const ContentBetween: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="d-flex justify-content-between">
    {children}
  </div>
);

interface Size {
  size?: '1' | '2' | '3' | '4' | '5' | '6';
}

export const Margin: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`m-${size}`}>
    {children}
  </div>
);

export const MT: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`mt-${size}`}>
    {children}
  </div>
);
export const ME: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`me-${size}`}>
    {children}
  </div>
);
export const MB: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`mb-${size}`}>
    {children}
  </div>
);
export const MS: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`ms-${size}`}>
    {children}
  </div>
);

export const PT: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`pt-${size}`}>
    {children}
  </div>
);
export const PE: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`pe-${size}`}>
    {children}
  </div>
);
export const PB: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`pb-${size}`}>
    {children}
  </div>
);
export const PS: React.FC<Size> = ({ children, size = '1' }): JSX.Element => (
  <div className={`ps-${size}`}>
    {children}
  </div>
);
