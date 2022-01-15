import React, { useEffect, useMemo, useState } from 'react';
import { BigNumber } from 'ethers';
import { useLoadPool } from '../../hooks/useLoadPool';
import { useUpdateBalance } from '../../hooks/useUpdateBalance';
import { useUpdateLiquidityAmount } from '../../hooks/useUpdateAmount';
import { useUpdateTokensPrice } from '../../hooks/useUpdateTokensPrice';
import {
  ButtonStatus,
  ensure,
  calculateAmount,
  assertAmount,
  ensureAmount,
  calculateAmountWithPercentage,
  calculateDeadline,
  errorHandler,
  TxStatusHandler, TX_STATUS_ERROR_CODE,
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
  availableNetworks,
  createEmptyTokenWithAmount,
  defaultSettings,
  Network,
  ReefSigner,
  reefTokenWithAmount,
  resolveSettings,
  Token,
  TokenWithAmount,
} from '../../state';
import { approveTokenAmount, getReefswapRouter } from '../../rpc';

interface AddLiquidityComponent {
  tokens: Token[];
  network: Network;
  token1?: TokenWithAmount;
  token2?: TokenWithAmount;
  signer: ReefSigner;
  back: () => void;
  onTxUpdate?: TxStatusHandler;
  onAddressChangeLoad?: (address: string) => Promise<void>;
}

const liquidityStatus = (token1: TokenWithAmount, token2: TokenWithAmount, isEvmClaimed?: boolean): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind account');
    ensure(!token1.isEmpty, 'Select first token');
    ensure(!token2.isEmpty, 'Select second token');
    ensure(token2.address !== token1.address, 'Tokens must be different');
    ensure(token1.amount.length !== 0, 'Missing first token amount');
    ensure(token2.amount.length !== 0, 'Missing second token amount');
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
  tokens, network, token1, token2, signer, back, onTxUpdate, onAddressChangeLoad,
} : AddLiquidityComponent): JSX.Element => {
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [isLiquidityLoading, setIsLiquidityLoading] = useState(false);

  const [tkn2, setTkn2] = useState(createEmptyTokenWithAmount());
  const [tkn1, setTkn1] = useState(reefTokenWithAmount());
  const { deadline, percentage } = resolveSettings(settings);

  const [pool, isPoolLoading] = useLoadPool(tkn1, tkn2, network.factoryAddress, signer?.signer);

  const { text, isValid } = useMemo(
    () => liquidityStatus(tkn1, tkn2, signer?.isEvmClaimed),
    [tkn1, tkn2, signer?.isEvmClaimed],
  );

  useUpdateBalance(tkn1, tokens, setTkn1);
  useUpdateBalance(tkn2, tokens, setTkn2);
  const isPriceLoading = useUpdateTokensPrice({
    pool,
    token1: tkn1,
    token2: tkn2,
    tokens,
    setToken1: setTkn1,
    setToken2: setTkn2,
    signer: signer?.signer,
    factoryAddress: network.factoryAddress,
  });
  useUpdateLiquidityAmount({
    pool,
    token1: tkn1,
    token2: tkn2,
    setToken1: setTkn1,
    setToken2: setTkn2,
  });

  const isLoading = isLiquidityLoading || isPoolLoading || isPriceLoading;

  const changeToken1 = (newToken: Token): void => setTkn1({
    ...newToken, amount: '', price: 0, isEmpty: false,
  });
  const changeToken2 = (newToken: Token): void => setTkn2({
    ...newToken, amount: '', price: 0, isEmpty: false,
  });

  useEffect(() => {
    changeToken1(token1 || createEmptyTokenWithAmount());
  }, [token1, signer]);

  useEffect(() => {
    changeToken2(token2 || createEmptyTokenWithAmount());
  }, [token2, signer]);

  const setAmount1 = (amount: string): void => {
    if (isLoading) { return; }
    const newAmount = tkn1.price / tkn2.price * parseFloat(assertAmount(amount));
    setTkn1({ ...tkn1, amount });
    if (!Number.isNaN(newAmount)) {
      setTkn2({ ...tkn2, amount: !amount ? '' : newAmount.toFixed(4) });
    }
  };
  const setAmount2 = (amount: string): void => {
    if (isLoading) { return; }
    const newAmount = tkn2.price / tkn1.price * parseFloat(assertAmount(amount));
    setTkn2({ ...tkn2, amount });
    if (!Number.isNaN(newAmount)) {
      setTkn1({ ...tkn1, amount: !amount ? '' : newAmount.toFixed(4) });
    }
  };

  const addLiquidityClick = async (): Promise<void> => {
    if (!signer) { return; }
    const { evmAddress } = signer;
    const txIdent = Math.random().toString(10);
    try {
      setIsLiquidityLoading(true);
      ensureAmount(tkn1);
      ensureAmount(tkn2);

      setStatus(`Approving ${tkn1.name} token`);
      await approveTokenAmount(tkn1, network.routerAddress, signer.signer);
      setStatus(`Approving ${tkn2.name} token`);
      await approveTokenAmount(tkn2, network.routerAddress, signer.signer);

      setStatus('Adding supply');
      const reefswapRouter = getReefswapRouter(network.routerAddress, signer.signer);
      if (onTxUpdate) {
        onTxUpdate({
          txIdent,
        });
      }
      const contractCall: any = await reefswapRouter.addLiquidity(
        tkn1.address,
        tkn2.address,
        calculateAmount(tkn1),
        calculateAmount(tkn2),
        calculateAmountWithPercentage(tkn1, percentage), // min amount token1
        calculateAmountWithPercentage(tkn2, percentage), // min amount token2
        evmAddress,
        calculateDeadline(deadline),
      );
      if (onTxUpdate) {
        onTxUpdate({
          txIdent,
          txHash: contractCall.hash,
          isInBlock: true,
          txTypeEvm: true,
          url: `https://${network === availableNetworks.mainnet ? '' : `${network.name}.`}reefscan.com/extrinsic/${contractCall.hash}`,
          addresses: [signer.address],
        });
      }
    } catch (error) {
      const message = errorHandler(error.message)
        .replace('first', tkn1.name)
        .replace('second', tkn2.name);
      if (onTxUpdate) {
        onTxUpdate({
          txIdent,
          error: { message, code: TX_STATUS_ERROR_CODE.ERROR_UNDEFINED },
          txTypeEvm: true,
          addresses: [signer.address],
        });
      }
    } finally {
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
          token={tkn1}
          tokens={tokens}
          signer={signer}
          id="add-liquidity-token-1"
          onAmountChange={setAmount1}
          onTokenSelect={changeToken1}
          onAddressChange={onAddressChangeLoad}
        />
        <SwitchTokenButton disabled addIcon />
        <TokenAmountField
          token={tkn2}
          tokens={tokens}
          signer={signer}
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
          token1={tkn1}
          token2={tkn2}
          percentage={percentage}
          confirmFun={addLiquidityClick}
          id="swap-modal-toggle"
        />
      </Card>
    </ComponentCenter>
  );
};
