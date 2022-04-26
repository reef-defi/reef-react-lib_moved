import React, { useEffect, useRef, useState } from 'react';
import { useLoadPool } from '../../hooks/useLoadPool';
import { approveAmount, getReefswapRouter } from '../../rpc';
import {
  defaultOptions,
  DefaultOptions,
  defaultSettings,
  Network,
  Pool,
  ReefSigner,
  REMOVE_DEFAULT_SLIPPAGE_TOLERANCE,
  resolveSettings,
  Token,
} from '../../state';
import {
  ButtonStatus,
  calculateDeadline,
  calculatePoolRatio,
  ensure,
  ensureVoidRun,
  removePoolTokenShare,
  removeSupply,
  showRemovePoolTokenShare,
  transformAmount,
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
  token1: Token;
  token2: Token;
  network: Network;
  signer?: ReefSigner;
  options?: Partial<DefaultOptions>;
}

const status = (percentageAmount: number, pool?: Pool): ButtonStatus => {
  try {
    ensure(!!pool, 'Invalid Pair');
    ensure(pool?.userPoolBalance !== '0', 'Insufficient pool balance');
    ensure(percentageAmount > 0, 'Enter an amount');
    return {
      isValid: true,
      text: 'Confirm remove',
    };
  } catch (e) {
    return {
      isValid: false,
      text: e.message,
    };
  }
};

export const RemoveLiquidityComponent = ({
  token1,
  token2,
  signer,
  network,
  options,
}: RemoveLiquidityComponent): JSX.Element => {
  const mounted = useRef(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [percentageAmount, setPercentageAmount] = useState(0);

  const { notify, back } = { ...defaultOptions, ...options };
  const [pool, isPoolLoading] = useLoadPool(
    token1,
    token2,
    network.factoryAddress,
    signer?.signer,
  );
  const { isValid, text } = status(percentageAmount, pool);
  const { percentage, deadline } = resolveSettings(
    settings,
    REMOVE_DEFAULT_SLIPPAGE_TOLERANCE,
  );

  const isLoading = isRemoving || isPoolLoading;

  const ensureMount = ensureVoidRun(mounted.current);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const onRemove = async (): Promise<void> => {
    if (!pool || percentageAmount === 0 || !signer) {
      return;
    }

    const reefswapRouter = getReefswapRouter(
      network.routerAddress,
      signer.signer,
    );
    const normalRemovedSupply = removeSupply(
      percentageAmount,
      pool.userPoolBalance,
      18,
    );
    const removedLiquidity = transformAmount(18, `${normalRemovedSupply}`);

    const minimumTokenAmount1 = removePoolTokenShare(
      Math.max(percentageAmount - percentage, 0),
      pool.token1,
    );
    const minimumTokenAmount2 = removePoolTokenShare(
      Math.max(percentageAmount - percentage, 0),
      pool.token2,
    );

    Promise.resolve()
      .then(() => {
        mounted.current = true;
      })
      .then(() => setIsRemoving(true))
      .then(() => setLoadingStatus('Approving remove'))
      .then(() => approveAmount(
        pool.poolAddress,
        network.routerAddress,
        removedLiquidity,
        signer.signer,
      ))
      .then(() => setLoadingStatus('Removing supply'))
      .then(() => reefswapRouter.removeLiquidity(
        pool.token1.address,
        pool.token2.address,
        removedLiquidity,
        minimumTokenAmount1,
        minimumTokenAmount2,
        signer.evmAddress,
        calculateDeadline(deadline),
      ))
      .then(() => {
        notify('Balances will reload after blocks are finalized.', 'info');
        notify('Liquidity removed successfully!');
      })
      .catch((e) => {
        notify(`There was something wrong when removing liquidity: ${e.message}`, 'error');
        console.error('Remove failed');
        console.error(e);
      })
      .finally(() => {
        ensureMount(setIsRemoving, false);
        ensureMount(setLoadingStatus, '');
      });
  };

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
            onChange={(value) => setPercentageAmount(value)}
          />
          <MT size="2" />
          <MX size="3">
            <ContentBetween>
              <Button onClick={() => setPercentageAmount(25)}>25%</Button>
              <Button onClick={() => setPercentageAmount(50)}>50%</Button>
              <Button onClick={() => setPercentageAmount(75)}>75%</Button>
              <Button onClick={() => setPercentageAmount(100)}>100%</Button>
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
          disabled={!isValid || isPoolLoading}
        >
          {isLoading ? (
            <LoadingButtonIconWithText text={loadingStatus} />
          ) : (
            text
          )}
        </OpenModalButton>
        <RemoveConfirmationModal
          pool={pool!}
          slipperage={percentage}
          id="remove-modal-toggle"
          percentageAmount={percentageAmount}
          onRemove={onRemove}
        />
      </Card>
    </ComponentCenter>
  );
};
