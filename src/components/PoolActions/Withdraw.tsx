import React, { useMemo, useState } from 'react';
import Uik from '@reef-chain/ui-kit';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
import BigNumber from 'bignumber.js';
import { RemoveLiquidityState } from '../../store';
import WithdrawPopup from './ConfirmPopups/Withdraw';
import { removeUserPoolSupply, calculatePoolShare } from '../../utils';

interface WithdrawActions {
  onRemoveLiquidity: () => Promise<void>;
  setPercentage: (percentage: number) => void;
}

interface Withdraw {
  state: RemoveLiquidityState;
  actions: WithdrawActions;
  confirmText?: string;
}

export const Withdraw = ({
  state: {
    pool,
    isLoading,
    isValid,
    percentage,
    status,
    token1,
    token2,
  },
  actions: {
    onRemoveLiquidity,
    setPercentage,
  },
}: Withdraw): JSX.Element => {
  const getTotalValue = useMemo((): number => {
    const firstTokenValue = new BigNumber(token1.price).times(token1.amount).toNumber();
    const secondTokenValue = new BigNumber(token2.price).times(token2.amount).toNumber();
    const sum = firstTokenValue + secondTokenValue;
    return Uik.utils.maxDecimals(sum, 2);
  }, [token1, token2]);

  const [isPopupOpen, setPopupOpen] = useState(false);

  return (
    <div>
      <div
        className={`
          uik-pool-actions__withdraw-preview
          ${!isValid ? 'uik-pool-actions__withdraw-preview--empty' : ''}
        `}
      >
        <div className="uik-pool-actions__withdraw-percentage">
          <span className="uik-pool-actions__withdraw-percentage-value">{ percentage }</span>
          <span className="uik-pool-actions__withdraw-percentage-sign">%</span>
        </div>

        <div className="uik-pool-actions__withdraw-value">
          $
          { getTotalValue ? Uik.utils.formatAmount(getTotalValue) : '0.0' }
        </div>
      </div>

      <div className="uik-pool-actions__slider">
        <Uik.Slider
          value={percentage}
          onChange={(e) => {
            setPercentage(e);
          }}
          tooltip={`${Uik.utils.maxDecimals(percentage, 2)}%`}
          stickyHelpers={false}
          helpers={[
            { position: 0, text: '0%' },
            { position: 25 },
            { position: 50, text: '50%' },
            { position: 75 },
            { position: 100, text: '100%' },
          ]}
        />
      </div>

      <Uik.Button
        className="uik-pool-actions__cta"
        fill
        icon={faArrowUpFromBracket}
        text={status}
        size="large"
        disabled={!isValid || isLoading}
        loading={isLoading}
        onClick={() => setPopupOpen(true)}
      />
      { !!pool
        && (
        <WithdrawPopup
          isOpen={isPopupOpen}
          onClose={() => setPopupOpen(false)}
          onConfirm={onRemoveLiquidity}
          pool={pool}
          price1={token1.price}
          price2={token2.price}
          percentageAmount={percentage}
          LPTokens={removeUserPoolSupply(percentage, pool).toFixed(8)}
          poolShare={`${calculatePoolShare(pool).toFixed(8)} %`}
        />
        )}
    </div>
  );
};
