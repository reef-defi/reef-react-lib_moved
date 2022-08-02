import React, { useMemo, useState } from 'react';
import Uik from '@reef-defi/ui-kit';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
import BigNumber from 'bignumber.js';
import { RemoveLiquidityState } from '../../store';
import WithdrawPopup from './ConfirmPopups/Withdraw';
import { removeUserPoolSupply, calculatePoolShare } from '../../utils';

export interface WithdrawActions {
  onRemoveLiquidity: () => Promise<void>;
  setPercentage: (percentage: number) => void;
}

export interface Props {
  state: RemoveLiquidityState;
  actions: WithdrawActions
}

const Withdraw = ({
  state: {
    pool,
    isLoading,
    isValid,
    percentage: percentageAmount,
    status,
    token1,
    token2,
  },
  actions: {
    onRemoveLiquidity,
    setPercentage,
  },
}: Props): JSX.Element => {
  const getTotalValue = useMemo((): number => {
    const firstTokenValue = new BigNumber(token1.price).times(token1.amount).toNumber();
    const secondTokenValue = new BigNumber(token2.price).times(token2.amount).toNumber();
    const sum = firstTokenValue + secondTokenValue;
    return Uik.utils.maxDecimals(sum, 2);
  }, [token1, token2]);

  const [isPopupOpen, setPopupOpen] = useState(false);

  const getPercentage = useMemo(() => {
    if (isNaN(percentageAmount)) return 0;
    if (percentageAmount > 100) return 100;
    if (percentageAmount < 0) return 0;
    return percentageAmount;
  }, [percentageAmount]);

  const onConfirm = (): void => {
    if (onRemoveLiquidity) onRemoveLiquidity();
    Uik.dropMoney();
  };

  return (
    <div>
      <div
        className={`
          uik-pool-actions__withdraw-preview
          ${!getTotalValue ? 'uik-pool-actions__withdraw-preview--empty' : ''}
        `}
      >
        <div className="uik-pool-actions__withdraw-percentage">
          <span className="uik-pool-actions__withdraw-percentage-value">{ getPercentage }</span>
          <span className="uik-pool-actions__withdraw-percentage-sign">%</span>
        </div>

        <div className="uik-pool-actions__withdraw-value">
          $
          { getTotalValue ? Uik.utils.formatAmount(getTotalValue) : '0.0' }
        </div>
      </div>

      <div className="uik-pool-actions__slider">
        <Uik.Slider
          value={getPercentage}
          onChange={(e) => {
            setPercentage(e);
          }}
          tooltip={`${Uik.utils.maxDecimals(getPercentage, 2)}%`}
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
        text={isLoading ? status : 'Withdraw'}
        size="large"
        disabled={!isValid || isLoading}
        loading={isLoading}
        onClick={() => setPopupOpen(true)}
      />

      <WithdrawPopup
        isOpen={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        onConfirm={onConfirm}
        token1={token1}
        token2={token2}
        percentageAmount={getPercentage}
        LPTokens={removeUserPoolSupply(percentageAmount, pool).toFixed(8)}
        poolShare={`${calculatePoolShare(pool).toFixed(8)} %`}
      />
    </div>
  );
};

export default Withdraw;
