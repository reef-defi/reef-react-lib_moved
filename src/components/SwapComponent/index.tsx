import React from 'react';
import {
  ReefSigner,
  resolveSettings, Token,
} from '../../state';
import { SwapComponentActions } from '../../store/actions/swap';
import { SwapState } from '../../store/reducers/swap';
import {
  calculateImpactPercentage,
} from '../../utils/math';
import { SwitchTokenButton } from '../common/Button';
import {
  Card, CardHeader, CardHeaderBlank, CardTitle,
} from '../common/Card';
import { CenterColumn, ComponentCenter, MT } from '../common/Display';
import { LoadingButtonIconWithText } from '../common/Loading';
import { OpenModalButton } from '../common/Modal';
import {
  TokenAmountFieldImpactPrice,
  TokenAmountFieldMax,
} from '../TokenFields';
import { TransactionSettings } from '../TransactionSettings';
import SwapConfirmationModal from './SwapConfirmationModal';

interface SwapComponent {
  tokens: Token[];
  account: ReefSigner;
  state: SwapState;
  actions: SwapComponentActions;
}

export const SwapComponent = ({
  tokens,
  account,
  state: {
    token2: buy,
    token1: sell,
    status,
    isValid,
    settings,
    isLoading,
  },
  actions: {
    onSwap,
    onSwitch,
    setSettings,
    selectToken1,
    selectToken2,
    setToken1Amount,
    setToken2Amount,
    onAddressChange,
  },
}: SwapComponent): JSX.Element => {
  const { percentage } = resolveSettings(settings);
  return (
    <ComponentCenter>
      <Card>
        <CardHeader>
          <CardHeaderBlank />
          <CardTitle title="Swap" />
          <TransactionSettings settings={settings} setSettings={setSettings} />
        </CardHeader>

        <TokenAmountFieldMax
          token={sell}
          tokens={tokens}
          signer={account}
          id="sell-token-field"
          onAmountChange={setToken1Amount}
          onTokenSelect={selectToken1}
          onAddressChange={onAddressChange}
        />
        <SwitchTokenButton onClick={onSwitch} />
        <TokenAmountFieldImpactPrice
          token={buy}
          tokens={tokens}
          signer={account}
          id="buy-token-field"
          percentage={calculateImpactPercentage(sell, buy)}
          onAmountChange={setToken2Amount}
          onTokenSelect={selectToken2}
          onAddressChange={onAddressChange}
        />
        <MT size="2">
          <CenterColumn>
            <OpenModalButton id="swapModalToggle" disabled={!isValid || isLoading}>
              {isLoading ? (
                <LoadingButtonIconWithText
                  text={status}
                />
              ) : (
                status
              )}
            </OpenModalButton>
          </CenterColumn>
        </MT>
        <SwapConfirmationModal
          buy={buy}
          sell={sell}
          id="swapModalToggle"
          percentage={percentage}
          confirmFun={onSwap}
        />
      </Card>
    </ComponentCenter>
  );
};
