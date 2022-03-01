import React from 'react';
import { BackIcon } from '../Icons';

export const Card: React.FC = ({ children }): JSX.Element => (
  <div className="card border-rad">
    <div className="card-body">{children}</div>
  </div>
);

export const CardHeader: React.FC<unknown> = ({ children }) => (
  <div className="d-flex justify-content-between mb-2">{children}</div>
);

export const CardHeaderBlank = (): JSX.Element => (
  <div style={{ width: '46px' }} />
);

interface Title {
  title: string;
}

export const CardTitle: React.FC<Title> = ({ title }): JSX.Element => (
  <h5 className="h5 my-2 text-center">{title}</h5>
);

interface CardBack {
  onBack: () => void;
}

export const CardBack = ({ onBack }: CardBack): JSX.Element => (
  <button type="button" className="btn" onClick={onBack}>
    <BackIcon />
  </button>
);

interface ErrorCardProps {
  title: string;
  message: string;
}

export const ErrorCard = ({ title, message }: ErrorCardProps): JSX.Element => (
  <Card>
    <CardTitle title={title} />
    <p
      className="card-text text-danger"
      dangerouslySetInnerHTML={{ __html: message }}
    />
  </Card>
);

export const SubCard: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="field border-rad p-3">{children}</div>
);
