import Uik from '@reef-defi/ui-kit';
import React, { useState } from 'react';
import { SwapState } from '../../store';
import Provide, { Props as ProvideProps } from './Provide';
import Trade, { TradeActions } from './Trade';
import Withdraw, { Props as WithdrawProps } from './Withdraw';

// TODO Samo remove any
export type CustomFunction = (...args: any[]) => any

export interface Events {
  onTabChange?: CustomFunction
}

type Tab = 'Provide' | 'Withdraw' | 'Trade';

export interface Props extends Events {
  tab?: Tab,
  provide: ProvideProps,
  withdraw: WithdrawProps,
  trade: {
    state: SwapState;
    actions: TradeActions;
  };
  className?: string
}

export const PoolActions = ({
  tab = 'Trade',
  provide,
  withdraw,
  trade,
  className,
  onTabChange,
}: Props): JSX.Element => {
  const [currentTab, setTab] = useState(tab);

  const selectTab = (value: Tab): void => {
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
          options={['Trade', 'Provide', 'Withdraw']}
        />
      </div>

      {
        currentTab === 'Trade'
        && (
          <Trade
            state={trade.state}
            actions={trade.actions}
          />
        )
      }
      {
        currentTab === 'Provide'
        && (
          <Provide
            state={provide.state}
            actions={provide.actions}
          />
        )
      }

      {
        currentTab === 'Withdraw'
        && (
          <Withdraw
            state={withdraw.state}
            actions={withdraw.actions}
          />
        )
      }
    </div>
  );
};
