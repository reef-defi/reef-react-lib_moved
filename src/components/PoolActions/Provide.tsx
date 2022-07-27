import { faCoins } from '@fortawesome/free-solid-svg-icons';
import Uik from '@reef-defi/ui-kit';
import BigNumber from 'bignumber.js';
import React, { useMemo, useState } from 'react';
// import { Pool, TokenWithAmount } from '../../state';
import { AddLiquidityState } from '../../store';
// import { calculatePoolShare } from '../../utils/math';
import TokenField from './TokenField';

// import { ConfirmLabel } from '../common/Label';
// import ConfirmationModal from '../common/Modal';

export interface ProvideActions {
  onAddLiquidity: () => Promise<void>,
  setToken1Amount: (amount: string) => void,
  setToken2Amount: (amount: string) => void
}

export interface Props {
  state: AddLiquidityState,
  actions: ProvideActions
}

// TODO Samo fix modal
// const Modal = ({
//   onAddLiquidity,
//   newPoolSupply,
//   token1,
//   token2,
//   percentage,
//   pool,
// }: {
//   onAddLiquidity: () => Promise<void>,
//   newPoolSupply: string,
//   token1: TokenWithAmount,
//   token2: TokenWithAmount,
//   percentage: number,
//   pool?: Pool
// }): JSX.Element => (
//   <ConfirmationModal
//     id="supplyModalToggle"
//     title="Confirm Supply"
//     confirmFun={onAddLiquidity}
//   >
//     <label className="text-muted ms-2">You will recieve</label>

//     <div className="field border-rad p-3">
//       <ConfirmLabel
//         titleSize="h4"
//         valueSize="h6"
//         title={newPoolSupply}
//         value={`${token1.name}/${token2.name}`}
//       />
//     </div>
//     <div className="m-3">
//       <span className="mini-text text-muted d-inline-block">
//         Output is estimated. If the price changes by more than
//         {' '}
//         {percentage}
//         % your transaction will revert.
//       </span>
//     </div>
//     <div className="field p-2 border-rad">
//       <ConfirmLabel
//         title="Liquidity Provider Fee"
//         value="1.5 REEF"
//         titleSize="mini-text"
//         valueSize="mini-text"
//       />
//       <ConfirmLabel
//         title={`${token1.name} Deposited`}
//         value={`${token1.amount}`}
//         titleSize="mini-text"
//         valueSize="mini-text"
//       />
//       <ConfirmLabel
//         title={`${token2.name} Deposited`}
//         value={`${token2.amount}`}
//         titleSize="mini-text"
//         valueSize="mini-text"
//       />
//       <ConfirmLabel
//         title="Rates"
//         value={`1 ${token1.name} = ${(
//           token1.price / token2.price
//         ).toFixed(8)} ${token2.name}`}
//         titleSize="mini-text"
//         valueSize="mini-text"
//       />
//       <ConfirmLabel
//         title=""
//         value={`1 ${token2.name} = ${(
//           token2.price / token1.price
//         ).toFixed(8)} ${token1.name}`}
//         titleSize="mini-text"
//         valueSize="mini-text"
//       />
//       <ConfirmLabel
//         title="Share of Pool"
//         value={`${calculatePoolShare(pool).toFixed(8)} %`}
//         titleSize="mini-text"
//         valueSize="mini-text"
//       />
//     </div>
//   </ConfirmationModal>
// );

const Provide = ({
  state,
  actions: {
    onAddLiquidity,
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
    // newPoolSupply,
    // pool,
    status,
  } = state;

  // const { percentage } = resolveSettings(settings);
  const [perc, setPerc] = useState(0);

  const handleSlide = (value: number): void => {
    setPerc(value);
  };

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
          value={perc}
          onChange={handleSlide}
          tooltip={`${Uik.utils.maxDecimals(perc, 2)}%`}
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
        disabled={!isValid || isLoading}
        // TODO Samo once you have working modal remove on click
        // data-bs-toggle="modal"
        // data-bs-target="#supplyModalToggle"
        onClick={onAddLiquidity}
      >
        <Uik.Button
          className="uik-pool-actions__cta"
          fill
          icon={faCoins}
          text={isLoading ? status : 'Provide'}
          size="large"
          disabled={!isValid || isLoading}
          loading={isLoading}
        />
      </button>

      {/* <Modal
        onAddLiquidity={onAddLiquidity}
        newPoolSupply={newPoolSupply}
        token1={token1}
        token2={token2}
        percentage={percentage}
        pool={pool}
      /> */}
    </div>
  );
};

export default Provide;
