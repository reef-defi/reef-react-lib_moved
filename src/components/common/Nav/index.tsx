import React from 'react'

export const HorizontalNav: React.FC<{}> = ({ children }): JSX.Element => (
  <nav>{children}</nav>
)

export const VerticalNav: React.FC<{}> = ({ children }) => <nav>{children}</nav>

export const HorizontalContent: React.FC<{}> = ({ children }) => (
  <div className='d-flex justify-content-center'>
    <div className='d-flex w-auto nav-selection border-rad'>{children}</div>
  </div>
)
