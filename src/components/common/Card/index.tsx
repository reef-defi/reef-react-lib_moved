import React from 'react';
import './Card.css';

export const Card: React.FC = ({ children }): JSX.Element => (
  <div className="card border-rad">
    <div className="card-body">
      {children}
    </div>
  </div>
);

export const Header: React.FC<unknown> = ({ children }) => (
  <div className="d-flex justify-content-between mb-2">
    { children }
  </div>
);

export const HeaderBlank = (): JSX.Element => (
  <div style={{ width: '46px' }} />
);

interface Title {
  title: string;
}

export const Title: React.FC<Title> = ({ title }): JSX.Element => (
  <h5 className="h5 my-2 text-center">{title}</h5>
);

interface ErrorCardProps {
  title: string;
  message: string;
}

export const ErrorCard = ({ title, message } : ErrorCardProps): JSX.Element => (
  <Card>
    <Title title={title} />
    <p className="card-text text-danger" dangerouslySetInnerHTML={{ __html: message }} />
  </Card>
);