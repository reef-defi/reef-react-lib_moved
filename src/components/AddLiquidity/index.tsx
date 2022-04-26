import React, { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import { SwitchTokenButton } from '../common/Button';
import {
  Card, CardBack, CardHeader, CardTitle,
} from '../common/Card';
import { TokenAmountField } from '../TokenFields';
import { LoadingButtonIconWithText } from '../common/Loading';
import { approveTokenAmount, getReefswapRouter } from '../../rpc';
import {
  assertAmount,
  calculateAmount,
  calculateAmountWithPercentage,
  calculateDeadline,
  calculatePoolShare,
  calculatePoolSupply,
  ensureAmount,
} from '../../utils/math';
import { useUpdateBalance } from '../../hooks/useUpdateBalance';
import { useLoadPool } from '../../hooks/useLoadPool';
import { useUpdateTokensPrice } from '../../hooks/useUpdateTokensPrice';
import { useUpdateLiquidityAmount } from '../../hooks/useUpdateAmount';
import {
  createEmptyTokenWithAmount,
  DefaultOptions,
  defaultOptions,
  defaultSettings,
  Network,
  // PartialOptions,
  ReefSigner,
  resolveSettings,
  Token,
  TokenSelector,
  TokenWithAmount,
} from '../../state';
import {
  ButtonStatus,
  errorHandler,
} from '../../utils';
import { TransactionSettings } from '../TransactionSettings';
import ConfirmationModal from '../common/Modal';
import { ConfirmLabel } from '../common/Label';
import { ComponentCenter } from '../common/Display';

const errorStatus = (text: string): ButtonStatus => ({
  isValid: false,
  text,
});

const buttonStatus = (
  token1: TokenWithAmount,
  token2: TokenWithAmount,
  isEvmClaimed: boolean,
): ButtonStatus => {
  if (!isEvmClaimed) {
    return errorStatus('Bind account');
  }
  if (token1.isEmpty || token2.isEmpty) {
    return errorStatus('Invalid pair');
  }
  if (token1.amount.length === 0) {
    return errorStatus('Missing first token amount');
  }
  if (token2.amount.length === 0) {
    return errorStatus('Missing second token amount');
  }
  if (BigNumber.from(calculateAmount(token1)).gt(token1.balance)) {
    return errorStatus(`Insufficient ${token1.name} balance`);
  }
  if (BigNumber.from(calculateAmount(token2)).gt(token2.balance)) {
    return errorStatus(`Insufficient ${token2.name} balance`);
  }
  return { isValid: true, text: 'Supply' };
};

const loadingStatus = (
  status: string,
  isPoolLoading: boolean,
  isPriceLoading: boolean,
): string => {
  if (status) {
    return status;
  }
  if (isPoolLoading) {
    return 'Loading pool';
  }
  if (isPriceLoading) {
    return 'Loading prices';
  }
  return '';
};

interface AddLiquidityComponent {
  tokens: Token[];
  network: Network;
  tokenValue1: TokenWithAmount;
  tokenValue2: TokenWithAmount;
  signer: ReefSigner;
  options?: Partial<DefaultOptions>;
}

export const AddLiquidity = ({
  tokens,
  network,
  tokenValue1,
  tokenValue2,
  signer,
  options,
}: AddLiquidityComponent): JSX.Element => {
  const { signer: sgnr, evmAddress, isEvmClaimed } = signer;
  const {
    back, notify, onTokenSelect, updateTokenState, onAddressChange,
  } = { ...defaultOptions, ...options };

  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [isLiquidityLoading, setIsLiquidityLoading] = useState(false);

  const [token1, setToken1] = useState(tokenValue1);
  const [token2, setToken2] = useState(tokenValue2);

  const { deadline, percentage } = resolveSettings(settings);
  useEffect(
    () => setToken1(tokenValue1),
    [tokenValue1.address],
  );
  useEffect(
    () => setToken2(tokenValue2),
    [tokenValue2.address],
  );

  const [pool, isPoolLoading] = useLoadPool(
    token1,
    token2,
    network.factoryAddress,
    sgnr,
  );
  const newPoolSupply = calculatePoolSupply(token1, token2, pool);

  useUpdateBalance(token1, tokens, setToken1);
  useUpdateBalance(token2, tokens, setToken2);
  const isPriceLoading = useUpdateTokensPrice({
    pool,
    token1,
    token2,
    tokens,
    signer: sgnr,
    setToken1,
    setToken2,
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
  const { text, isValid } = buttonStatus(token1, token2, isEvmClaimed);

  // eslint-disable-next-line
  const changeToken = (type: TokenSelector) => (newToken: Token): void => {
    onTokenSelect(newToken.address, type);
    const tokenWithamo: TokenWithAmount = {
      ...createEmptyTokenWithAmount(false),
      ...newToken,
    };
    switch (type) {
      case 'token1': return setToken1(tokenWithamo);
      case 'token2': return setToken2(tokenWithamo);
      default:
    }
  };

  const setAmount1 = (amount: string): void => {
    if (isLoading) {
      return;
    }
    setToken1({ ...token1, amount });
    if (pool) {
      const ratio = BigNumber.from(pool.reserve1).mul(10000000).div(pool.reserve2).toNumber() / 10000000;
      const newAmount = ratio * parseFloat(assertAmount(amount));
      setToken2({ ...token2, amount: !newAmount ? '' : newAmount.toFixed(4) });
    }
  };
  const setAmount2 = (amount: string): void => {
    if (isLoading) {
      return;
    }
    setToken2({ ...token2, amount });
    if (pool) {
      const ratio = BigNumber.from(pool.reserve2).mul(10000000).div(pool.reserve1).toNumber() / 10000000;
      const newAmount = ratio * parseFloat(assertAmount(amount));
      setToken1({ ...token1, amount: !newAmount ? '' : newAmount.toFixed(4) });
    }
  };

  const addLiquidityClick = async (): Promise<void> => {
    try {
      setIsLiquidityLoading(true);
      ensureAmount(token1);
      ensureAmount(token2);

      const amount1 = calculateAmount(token1);
      const amount2 = calculateAmount(token2);
      const percentage1 = calculateAmountWithPercentage(token1, percentage);
      const percentage2 = calculateAmountWithPercentage(token2, percentage);

      setStatus(`Approving ${token1.name} token`);
      await approveTokenAmount(token1, network.routerAddress, sgnr);
      setStatus(`Approving ${token2.name} token`);
      await approveTokenAmount(token2, network.routerAddress, sgnr);

      setStatus('Adding supply');
      const reefswapRouter = getReefswapRouter(network.routerAddress, sgnr);

      await reefswapRouter.addLiquidity(
        token1.address,
        token2.address,
        amount1,
        amount2,
        percentage1,
        percentage2,
        evmAddress,
        calculateDeadline(deadline),
      );
      notify('Balances will reload after blocks are finalized.', 'info');
      notify('Liquidity added successfully!');
    } catch (error) {
      const message = errorHandler(error.message)
        .replace('first', token1.name)
        .replace('second', token2.name);

      notify(message, 'error');
      // toast.error(errorHandler(message));
    } finally {
      /* TODO const newTokens = await loadTokens(tokens, sgnr);
      dispatch(setAllTokensAction(newTokens)); */
      await updateTokenState()
        .catch(() => notify('Failed to reload token balances, please reload the page to see correct balances.', 'warning'));
      setIsLiquidityLoading(false);
      setStatus('');
    }
  };

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
          onAmountChange={setAmount1}
          onTokenSelect={changeToken('token1')}
          onAddressChange={onAddressChange}
        />
        <SwitchTokenButton disabled addIcon />

        <TokenAmountField
          token={token2}
          tokens={tokens}
          signer={signer}
          id="add-liquidity-token-2"
          onAmountChange={setAmount2}
          onTokenSelect={changeToken('token2')}
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
                text={loadingStatus(status, isPoolLoading, isPriceLoading)}
              />
            ) : (
              text
            )}
          </span>
        </button>

        <ConfirmationModal
          id="supplyModalToggle"
          title="Confirm Supply"
          confirmFun={addLiquidityClick}
        >
          <label className="text-muted ms-2">You will recieve</label>
          <div className="field border-rad p-3">
            <ConfirmLabel
              titleSize="h4"
              valueSize="h6"
              title={newPoolSupply.toFixed(8)}
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
