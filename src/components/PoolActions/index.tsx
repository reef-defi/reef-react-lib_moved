import Uik from '@reef-defi/ui-kit';
import React, { useState } from 'react';
import { SwapState } from '../../store';
import Provide, { Props as ProvideProps } from './Provide';
import Trade, { TradeActions } from './Trade';
import Withdraw, { Props as WithdrawProps } from './Withdraw';
import Finalizing from './Finalizing';

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
  className?: string,
  finalizing?: boolean
}

export const PoolActions = ({
  tab = 'Trade',
  provide,
  withdraw,
  trade,
  className,
  onTabChange,
  finalizing,
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
        finalizing
        && <Finalizing />
      }

      {
        currentTab === 'Trade' && !finalizing
        && (
          <Trade
            state={trade.state}
            actions={trade.actions}
          />
        )
      }

      {
        currentTab === 'Provide' && !finalizing
        && (
          <Provide
            state={provide.state}
            actions={provide.actions}
          />
        )
      }

      {
        currentTab === 'Withdraw' && !finalizing
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
