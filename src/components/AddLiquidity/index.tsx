import React from 'react';
import {
  // PartialOptions,
  ReefSigner,
  resolveSettings,
  Token,
} from '../../state';
import { AddLiquidityComponentActions, AddLiquidityState } from '../../store';
import { calculatePoolShare } from '../../utils/math';
import { SwitchTokenButton } from '../common/Button';
import {
  Card, CardBack, CardHeader, CardTitle,
} from '../common/Card';
import { ComponentCenter } from '../common/Display';
import { ConfirmLabel } from '../common/Label';
import { LoadingButtonIconWithText } from '../common/Loading';
import ConfirmationModal from '../common/Modal';
import { TokenAmountField } from '../TokenFields';
import { TransactionSettings } from '../TransactionSettings';

interface AddLiquidityComponent {
  tokens: Token[];
  signer: ReefSigner;
  state: AddLiquidityState;
  actions: AddLiquidityComponentActions;
}

export const AddLiquidity = ({
  state,
  tokens,
  signer,
  actions: {
    back,
    onAddLiquidity,
    selectToken1,
    selectToken2,
    setSettings,
    onAddressChange,
    setToken1Amount,
    setToken2Amount,
  },
}: AddLiquidityComponent): JSX.Element => {
  const {
    settings, token1, token2, isLoading, isValid, newPoolSupply, pool, status,
  } = state;
  const { percentage } = resolveSettings(settings);
  return (
    <ComponentCenter>
      <Card>
        <CardHeader>
          <CardBack onBack={back} />
          <CardTitle title="Add liquidity" />
          <TransactionSettings settings={settings} setSettings={setSettings} />
        </CardHeader>

        <div className="alert alert-danger mt-2 border-rad" role="alert">
          <b>Tip: </b>
          When you add liquidity, you will receive pool tokens representing your
          position. These tokens automatically earn fees proportional to your
          share of the pool, and can be redeemed at any time.
        </div>

        <TokenAmountField
          token={token1}
          tokens={tokens}
          signer={signer}
          id="add-liquidity-token-1"
          onAmountChange={setToken1Amount}
          onTokenSelect={selectToken1}
          onAddressChange={onAddressChange}
        />
        <SwitchTokenButton disabled addIcon />

        <TokenAmountField
          token={token2}
          tokens={tokens}
          signer={signer}
          id="add-liquidity-token-2"
          onAmountChange={setToken2Amount}
          onTokenSelect={selectToken2}
          onAddressChange={onAddressChange}
        />

        <button
          type="button"
          className="btn btn-reef btn-lg border-rad w-100 mt-2"
          disabled={!isValid || isLoading}
          data-bs-toggle="modal"
          data-bs-target="#supplyModalToggle"
        >
          <span>
            {isLoading ? (
              <LoadingButtonIconWithText
                text={status}
              />
            ) : (
              status
            )}
          </span>
        </button>

        <ConfirmationModal
          id="supplyModalToggle"
          title="Confirm Supply"
          confirmFun={onAddLiquidity}
        >
          <label className="text-muted ms-2">You will receive</label>
          <div className="field border-rad p-3">
            <ConfirmLabel
              titleSize="h4"
              valueSize="h6"
              title={newPoolSupply}
              value={`${token1.name}/${token2.name}`}
            />
          </div>
          <div className="m-3">
            <span className="mini-text text-muted d-inline-block">
              Output is estimated. If the price changes by more than
              {' '}
              {percentage}
              % your transaction will revert.
            </span>
          </div>
          <div className="field p-2 border-rad">
            <ConfirmLabel
              title="Liquidity Provider Fee"
              value="1.5 REEF"
              titleSize="mini-text"
              valueSize="mini-text"
            />
            <ConfirmLabel
              title={`${token1.name} Deposited`}
              value={`${token1.amount}`}
              titleSize="mini-text"
              valueSize="mini-text"
            />
            <ConfirmLabel
              title={`${token2.name} Deposited`}
              value={`${token2.amount}`}
              titleSize="mini-text"
              valueSize="mini-text"
            />
            <ConfirmLabel
              title="Rates"
              value={`1 ${token1.name} = ${(
                token1.price / token2.price
              ).toFixed(8)} ${token2.name}`}
              titleSize="mini-text"
              valueSize="mini-text"
            />
            <ConfirmLabel
              title=""
              value={`1 ${token2.name} = ${(
                token2.price / token1.price
              ).toFixed(8)} ${token1.name}`}
              titleSize="mini-text"
              valueSize="mini-text"
            />
            <ConfirmLabel
              title="Share of Pool"
              value={`${calculatePoolShare(pool).toFixed(8)} %`}
              titleSize="mini-text"
              valueSize="mini-text"
            />
          </div>
        </ConfirmationModal>
      </Card>
    </ComponentCenter>
  );
};
