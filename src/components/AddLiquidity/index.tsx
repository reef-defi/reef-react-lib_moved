import React, { useMemo, useState } from 'react';
import { BigNumber } from 'ethers';
import { useLoadPool } from '../../hooks/useLoadPool';
import { useUpdateBalance } from '../../hooks/useUpdateBalance';
import { useUpdateLiquidityAmount } from '../../hooks/useUpdateAmount';
import { useUpdateTokensPrice } from '../../hooks/useUpdateTokensPrice';
import {
  ButtonStatus, ensure, calculateAmount, assertAmount, ensureAmount, calculateAmountWithPercentage, calculateDeadline, errorHandler,
} from '../../utils';
import { CenterColumn, ComponentCenter, MT } from '../common/Display';
import {
  Card, CardBack, CardHeader, CardTitle,
} from '../common/Card';
import { TransactionSettings } from '../TransactionSettings';
import { DangerAlert } from '../common/Alert';
import { TokenAmountField } from '../TokenFields';
import { SwitchTokenButton } from '../common/Button';
import { OpenModalButton } from '../common/Modal';
import { LoadingButtonIconWithText } from '../common/Loading';
import ConfirmAddLiquidity from './ConfirmAddLiquidity';
import {
  createEmptyTokenWithAmount, defaultSettings, Network, Notify, ReefSigner, reefTokenWithAmount, resolveSettings, Token, TokenWithAmount,
} from '../../state';
import { approveTokenAmount, getReefswapRouter } from '../../rpc';

interface AddLiquidityComponent {
  tokens: Token[];
  network: Network;
  signer?: ReefSigner;
  back: () => void;
  reloadTokens: () => void;
  notify: (message: string, type: Notify) => void;
  onAddressChangeLoad?: (address: string) => Promise<void>;
}

const liquidityStatus = (token1: TokenWithAmount, token2: TokenWithAmount, isEvmClaimed?: boolean): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind account');
    ensure(!token1.isEmpty, 'Select first token');
    ensure(!token2.isEmpty, 'Select second token');
    ensure(token1.amount.length !== 0, 'Missing first token amount');
    ensure(token2.amount.length !== 0, 'Missing second token amount');
    ensure(token2.address !== token1.address, 'Select different tokens');
    ensure(BigNumber.from(calculateAmount(token1)).lte(token1.balance), `Insufficient ${token1.name} balance`);
    ensure(BigNumber.from(calculateAmount(token2)).lte(token2.balance), `Insufficient ${token2.name} balance`);
    return {
      isValid: true,
      text: 'Supply',
    };
  } catch (e) {
    return {
      isValid: false,
      text: e.message,
    };
  }
};

const loadingStatus = (status: string, isPoolLoading: boolean, isPriceLoading: boolean): string => {
  if (status) { return status; }
  if (isPoolLoading) { return 'Loading pool'; }
  if (isPriceLoading) { return 'Loading prices'; }
  return '';
};

export const AddLiquidityComponent = ({
  tokens, network, signer, back, notify, reloadTokens, onAddressChangeLoad,
} : AddLiquidityComponent): JSX.Element => {
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [isLiquidityLoading, setIsLiquidityLoading] = useState(false);

  const [token2, setToken2] = useState(createEmptyTokenWithAmount());
  const [token1, setToken1] = useState(reefTokenWithAmount());
  const { deadline, percentage } = resolveSettings(settings);

  const [pool, isPoolLoading] = useLoadPool(token1, token2, network.factoryAddress, signer?.signer);

  const { text, isValid } = useMemo(
    () => liquidityStatus(token1, token2, signer?.isEvmClaimed),
    [token1, token2, signer?.isEvmClaimed],
  );

  useUpdateBalance(token1, tokens, setToken1);
  useUpdateBalance(token2, tokens, setToken2);
  const isPriceLoading = useUpdateTokensPrice({
    pool,
    token1,
    token2,
    tokens,
    setToken1,
    setToken2,
    signer: signer?.signer,
    factoryAddress: network.factoryAddress,
  });
  useUpdateLiquidityAmount({
    pool,
    token1,
    token2,
    setToken1,
    setToken2,
  });

  const isLoading = isLiquidityLoading || isPoolLoading || isPriceLoading;

  const changeToken1 = (newToken: Token): void => setToken1({
    ...newToken, amount: '', price: 0, isEmpty: false,
  });
  const changeToken2 = (newToken: Token): void => setToken2({
    ...newToken, amount: '', price: 0, isEmpty: false,
  });

  const setAmount1 = (amount: string): void => {
    if (isLoading) { return; }
    const newAmount = token1.price / token2.price * parseFloat(assertAmount(amount));
    setToken1({ ...token1, amount });
    setToken2({ ...token2, amount: !amount ? '' : newAmount.toFixed(4) });
  };
  const setAmount2 = (amount: string): void => {
    if (isLoading) { return; }
    const newAmount = token2.price / token1.price * parseFloat(assertAmount(amount));
    setToken2({ ...token2, amount });
    setToken1({ ...token1, amount: !amount ? '' : newAmount.toFixed(4) });
  };

  const addLiquidityClick = async (): Promise<void> => {
    if (!signer) { return; }
    const { evmAddress } = signer;
    try {
      setIsLiquidityLoading(true);
      ensureAmount(token1);
      ensureAmount(token2);

      setStatus(`Approving ${token1.name} token`);
      await approveTokenAmount(token1, network.routerAddress, signer.signer);
      setStatus(`Approving ${token2.name} token`);
      await approveTokenAmount(token2, network.routerAddress, signer.signer);

      setStatus('Adding supply');
      const reefswapRouter = getReefswapRouter(network.routerAddress, signer.signer);

      await reefswapRouter.addLiquidity(
        token1.address,
        token2.address,
        calculateAmount(token1),
        calculateAmount(token2),
        calculateAmountWithPercentage(token1, percentage), // min amount token1
        calculateAmountWithPercentage(token2, percentage), // min amount token2
        evmAddress,
        calculateDeadline(deadline),
      );
      notify(`${token1.name}/${token2.name} supply added successfully!`, 'success');
    } catch (error) {
      const message = errorHandler(error.message)
        .replace('first', token1.name)
        .replace('second', token2.name);

      notify(message, 'error');
    } finally {
      reloadTokens();
      setStatus('');
    }
  };

  return (
    <ComponentCenter>
      <Card>
        <CardHeader>
          <CardBack onBack={back} />
          <CardTitle title="Add liquidity" />
          <TransactionSettings
            settings={settings}
            setSettings={setSettings}
          />
        </CardHeader>

        <DangerAlert>
          <b>Tip: </b>
          When you add liquidity, you will receive pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time.
        </DangerAlert>

        <TokenAmountField
          token={token1}
          tokens={tokens}
          id="add-liquidity-token-1"
          onAmountChange={setAmount1}
          onTokenSelect={changeToken1}
          onAddressChange={onAddressChangeLoad}
        />
        <SwitchTokenButton disabled addIcon />
        <TokenAmountField
          token={token2}
          tokens={tokens}
          id="add-liquidity-token-2"
          onAmountChange={setAmount2}
          onTokenSelect={changeToken2}
          onAddressChange={onAddressChangeLoad}
        />
        <MT size="2">
          <CenterColumn>
            <OpenModalButton
              id="swap-modal-toggle"
              disabled={!isValid || isLoading}
            >
              {isLoading
                ? <LoadingButtonIconWithText text={loadingStatus(status, isPoolLoading, isPriceLoading)} />
                : text}
            </OpenModalButton>
          </CenterColumn>
        </MT>
        <ConfirmAddLiquidity
          pool={pool}
          token1={token1}
          token2={token2}
          percentage={percentage}
          confirmFun={addLiquidityClick}
          id="swap-modal-toggle"
        />
      </Card>
    </ComponentCenter>
  );
};
