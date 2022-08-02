import { faCoins } from '@fortawesome/free-solid-svg-icons';
import Uik from '@reef-defi/ui-kit';
import BigNumber from 'bignumber.js';
import React, { useState, useMemo } from 'react';
import { AddLiquidityState } from '../../store';
import { calculatePoolShare } from '../../utils/math';
import TokenField from './TokenField';

import ProvidePopup from './ConfirmPopups/Provide';

export interface ProvideActions {
  onAddLiquidity: () => Promise<void>;
  setToken1Amount: (amount: string) => void;
  setToken2Amount: (amount: string) => void;
  setPercentage: (amount: number) => void;
}

export interface Props {
  state: AddLiquidityState,
  actions: ProvideActions
}

const Provide = ({
  state,
  actions: {
    onAddLiquidity,
    setPercentage,
    setToken1Amount,
    setToken2Amount,
  },
}: Props): JSX.Element => {
  const {
    // settings,
    token1,
    token2,
    isLoading,
    isValid,
    newPoolSupply,
    pool,
    percentage,
    status,
  } = state;
  const getTotalValue = useMemo((): number => {
    const firstTokenValue = new BigNumber(token1.price).times(token1.amount).toNumber();
    const secondTokenValue = new BigNumber(token2.price).times(token2.amount).toNumber();
    const sum = firstTokenValue + secondTokenValue;
    return Uik.utils.maxDecimals(sum, 2);
  }, [token1, token2]);

  const [isPopupOpen, setPopupOpen] = useState(false);

  const getPercentage = useMemo(() => {
    if (isNaN(percentage)) return 0;
    if (percentage > 100) return 100;
    if (percentage < 0) return 0;
    return percentage;
  }, [percentage]);

  const onConfirm = (): void => {
    if (onAddLiquidity) onAddLiquidity();
    Uik.dropConfetti();
  };

  return (
    <div>
      <div className="uik-pool-actions__tokens">
        <TokenField
          token={token1}
          onAmountChange={setToken1Amount}
        />

        <TokenField
          token={token2}
          onAmountChange={setToken2Amount}
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
          value={getPercentage}
          onChange={setPercentage}
          tooltip={`${Uik.utils.maxDecimals(getPercentage, 2)}%`}
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
        icon={faCoins}
        text={isLoading ? status : 'Provide'}
        size="large"
        disabled={!isValid || isLoading}
        loading={isLoading}
        onClick={() => setPopupOpen(true)}
      />

      <ProvidePopup
        isOpen={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        onConfirm={onConfirm}
        poolShare={`${calculatePoolShare(pool).toFixed(8)} %`}
        token1={token1}
        token2={token2}
        percentage={getPercentage}
        LPTokens={newPoolSupply}
      />
    </div>
  );
};

export default Provide;
