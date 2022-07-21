import React, { useState } from 'react';
import Uik from '@reef-defi/ui-kit';
import Provide, { Props as ProvideProps } from './Provide';

export type CustomFunction = (...args: any[]) => any

export interface Events {
  onTabChange?: CustomFunction
}

export interface Props extends Events {
  tab?: 'Provide' | 'Withdraw' | 'Trade',
  provide: ProvideProps,
  className?: string
}

export const PoolActions = ({
  tab = 'Provide',
  provide,
  className,
  onTabChange,
}: Props): JSX.Element => {
  const [currentTab, setTab] = useState(tab);

  const selectTab = (value: 'Provide' | 'Withdraw' | 'Trade'): void => {
    if (onTabChange) {
      const from = currentTab;
      const to = value;

      onTabChange({ from, to });
    }

    setTab(value);
  };

  return (
    <div
      className={`
        uik-pool-actions
        ${className || ''}
      `}
    >
      <div className="uik-pool-actions__top">
        <Uik.Tabs
          value={currentTab}
          onChange={(value) => selectTab(value)}
          options={['Provide', 'Withdraw', 'Trade']}
        />
      </div>

      {
        currentTab === 'Provide'
        && (
          <Provide
            state={provide.state}
            actions={provide.actions}
          />
        )
      }
    </div>
  );
};
