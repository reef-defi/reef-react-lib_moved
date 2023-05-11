import React from 'react';
import {
  REMOVE_DEFAULT_SLIPPAGE_TOLERANCE,
  resolveSettings,
} from '../../state';
import { RemoveLiquidityComponentActions, RemoveLiquidityState } from '../../store';
import {
  calculatePoolRatio, showRemovePoolTokenShare,
} from '../../utils';
import { DangerAlert } from '../common/Alert';
import { Button } from '../common/Button';
import {
  Card, CardBack, CardHeader, CardTitle, SubCard,
} from '../common/Card';
import {
  ComponentCenter,
  ContentBetween,
  ContentCenter,
  Margin,
  MT,
  MX,
} from '../common/Display';
import { DownIcon } from '../common/Icons';
import { PercentageRangeAmount } from '../common/Input';
import { ConfirmLabel } from '../common/Label';
import { LoadingButtonIconWithText } from '../common/Loading';
import { OpenModalButton } from '../common/Modal';
import { LargeTitle } from '../common/Text';
import { TransactionSettings } from '../TransactionSettings';
import RemoveConfirmationModal from './RemoveConfirmationModal';

interface RemoveLiquidityComponent {
  state: RemoveLiquidityState;
  actions: RemoveLiquidityComponentActions
}

export const RemoveLiquidityComponent = ({
  state: {
    settings,
    pool,
    isLoading,
    isValid,
    percentage: percentageAmount,
    status,
    token1,
    token2,
  },
  actions: {
    back,
    onRemoveLiquidity,
    setPercentage,
    setSettings,
  },
}: RemoveLiquidityComponent): JSX.Element => {
  const { percentage } = resolveSettings(settings);
  return (
    <ComponentCenter>
      <Card>
        <CardHeader>
          <CardBack onBack={back} />
          <CardTitle title="Remove supply" />
          <TransactionSettings
            settings={settings}
            setSettings={setSettings}
            defaultSlippageTolerance={REMOVE_DEFAULT_SLIPPAGE_TOLERANCE}
          />
        </CardHeader>
        <DangerAlert>
          <b>Tip: </b>
          Removing pool tokens converts your position back into underlying
          tokens at the current rate, proportional to your share of the pool.
          Accrued fees are included in the amounts you receive.
        </DangerAlert>
        <SubCard>
          <LargeTitle>{`${percentageAmount} %`}</LargeTitle>
          <PercentageRangeAmount
            disabled={!pool}
            value={percentageAmount}
            onChange={(value) => setPercentage(value)}
          />
          <MT size="2" />
          <MX size="3">
            <ContentBetween>
              <Button onClick={() => setPercentage(25)}>25%</Button>
              <Button onClick={() => setPercentage(50)}>50%</Button>
              <Button onClick={() => setPercentage(75)}>75%</Button>
              <Button onClick={() => setPercentage(100)}>100%</Button>
            </ContentBetween>
          </MX>
        </SubCard>
        <MT size="2" />
        <ContentCenter>
          <DownIcon />
        </ContentCenter>
        <MT size="2" />
        <SubCard>
          <Margin size="3">
            <ConfirmLabel
              title={showRemovePoolTokenShare(
                percentageAmount,
                pool?.token1,
              )}
              value={token1.name}
              titleSize="title-text"
              valueSize="title-text"
            />
            <ConfirmLabel
              title={showRemovePoolTokenShare(
                percentageAmount,
                pool?.token2,
              )}
              value={token2.name}
              titleSize="title-text"
              valueSize="title-text"
            />
          </Margin>
        </SubCard>
        <MT size="3" />
        <MX size="4">
          <ConfirmLabel
            title="Price"
            value={`1 ${token1.name} = ${calculatePoolRatio(pool).toFixed(8)} ${
              token2.name
            }`}
          />
          <ConfirmLabel
            title=""
            value={`1 ${token2.name} = ${calculatePoolRatio(
              pool,
              false,
            ).toFixed(8)} ${token1.name}`}
          />
        </MX>
        <MT size="2" />
        <OpenModalButton
          id="remove-modal-toggle"
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <LoadingButtonIconWithText text={status} />
          ) : (
            status
          )}
        </OpenModalButton>
        <RemoveConfirmationModal
          pool={pool!}
          slippage={percentage}
          id="remove-modal-toggle"
          percentageAmount={percentageAmount}
          onRemove={onRemoveLiquidity}
        />
      </Card>
    </ComponentCenter>
  );
};
