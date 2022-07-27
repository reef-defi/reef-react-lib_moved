import React, { useMemo } from 'react';
import Uik from '@reef-defi/ui-kit';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
import BigNumber from 'bignumber.js';
// import { resolveSettings } from '../../state';
import { RemoveLiquidityState } from '../../store';
// import RemoveConfirmationModal from '../RemoveLiquidity/RemoveConfirmationModal';
import TokenField from './TokenField';

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
    // settings,
    // pool,
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

  return (
    <div>
      <div className="uik-pool-actions__tokens">
        <TokenField
          token={token1}
          onAmountChange={() => {}}
        />

        <TokenField
          token={token2}
          onAmountChange={() => {}}
        />
      </div>

      <div className="uik-pool-actions__summary">
        <div
          className={`
            uik-pool-actions__summary-item
            ${!getTotalValue ? 'uik-pool-actions__summary-item--empty' : ''}
          `}
        >
          <div className="uik-pool-actions__summary-item-label">Total</div>
          <div className="uik-pool-actions__summary-item-value">
            $
            { getTotalValue ? Uik.utils.formatAmount(getTotalValue) : '0.0' }
          </div>
        </div>
      </div>

      <div className="uik-pool-actions__slider">
        <Uik.Slider
          value={percentageAmount}
          onChange={(e) => {
            setPercentage(e)
          }}
          tooltip={`${Uik.utils.maxDecimals(percentageAmount, 2)}%`}
          helpers={[
            { position: 0, text: '0%' },
            { position: 25 },
            { position: 50, text: '50%' },
            { position: 75 },
            { position: 100, text: '100%' },
          ]}
        />
      </div>

      <button
        className="uik-pool-actions__cta-wrapper"
        type="button"
        onClick={onRemoveLiquidity}
        // data-bs-toggle="modal"
        // data-bs-target="remove-modal-toggle"
        disabled={!isValid || isLoading}
      >
        <Uik.Button
          className="uik-pool-actions__cta"
          fill
          icon={faArrowUpFromBracket}
          text={isLoading ? status : 'Withdraw'}
          size="large"
          disabled={!isValid || isLoading}
          loading={isLoading}
        />
      </button>

      {/* <RemoveConfirmationModal
        pool={pool!}
        slipperage={percentage}
        id="remove-modal-toggle"
        percentageAmount={percentageAmount}
        onRemove={onRemoveLiquidity}
      /> */}
    </div>
  );
};

export default Withdraw;
