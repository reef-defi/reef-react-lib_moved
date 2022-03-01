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
import {
  ButtonStatus,
  errorHandler,
  TX_STATUS_ERROR_CODE,
  TxStatusHandler,
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
  tokenValue1?: TokenWithAmount;
  tokenValue2?: TokenWithAmount;
  signer: ReefSigner;
  back: () => void;
  onTxUpdate?: TxStatusHandler;
  onAddressChangeLoad?: (address: string) => Promise<void>;
}

export const AddLiquidityComponent = ({
  tokens,
  network,
  tokenValue1,
  tokenValue2,
  signer,
  back,
  onTxUpdate,
  onAddressChangeLoad,
}: AddLiquidityComponent): JSX.Element => {
  const { signer: sgnr, evmAddress, isEvmClaimed } = signer;

  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [isLiquidityLoading, setIsLiquidityLoading] = useState(false);

  const [token2, setToken2] = useState(
    tokenValue2 || createEmptyTokenWithAmount(),
  );
  const [token1, setToken1] = useState(tokenValue1 || reefTokenWithAmount());
  const { deadline, percentage } = resolveSettings(settings);
  useEffect(() => {
    if (tokenValue2) {
      setToken2(tokenValue2);
    }
  }, [tokenValue2]);

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

  const changeToken1 = (newToken: Token): void => setToken1({
    ...newToken,
    amount: '',
    price: 0,
    isEmpty: false,
  });
  const changeToken2 = (newToken: Token): void => setToken2({
    ...newToken,
    amount: '',
    price: 0,
    isEmpty: false,
  });

  const setAmount1 = (amount: string): void => {
    if (isLoading) {
      return;
    }
    setToken1({ ...token1, amount });
    if (token1.price && token2.price) {
      const newAmount = (token1.price / token2.price) * parseFloat(assertAmount(amount));
      setToken2({ ...token2, amount: !newAmount ? '' : newAmount.toFixed(4) });
    }
  };
  const setAmount2 = (amount: string): void => {
    if (isLoading) {
      return;
    }
    setToken2({ ...token2, amount });
    if (token1.price && token2.price) {
      const newAmount = (token2.price / token1.price) * parseFloat(assertAmount(amount));
      setToken1({ ...token1, amount: !newAmount ? '' : newAmount.toFixed(4) });
    }
  };

  const addLiquidityClick = async (): Promise<void> => {
    const txIdent = Math.random().toString(10);
    try {
      setIsLiquidityLoading(true);
      ensureAmount(token1);
      ensureAmount(token2);
      if (onTxUpdate) {
        onTxUpdate({
          txIdent,
        });
      }
      setStatus(`Approving ${token1.name} token`);
      await approveTokenAmount(token1, network.routerAddress, sgnr);
      setStatus(`Approving ${token2.name} token`);
      await approveTokenAmount(token2, network.routerAddress, sgnr);

      setStatus('Adding supply');
      const reefswapRouter = getReefswapRouter(network.routerAddress, sgnr);
      if (onTxUpdate) {
        onTxUpdate({
          txIdent,
        });
      }
      const contractCall = await reefswapRouter.addLiquidity(
        token1.address,
        token2.address,
        calculateAmount(token1),
        calculateAmount(token2),
        calculateAmountWithPercentage(token1, percentage), // min amount token1
        calculateAmountWithPercentage(token2, percentage), // min amount token2
        evmAddress,
        calculateDeadline(deadline),
      );
      if (onTxUpdate) {
        onTxUpdate({
          txIdent,
          txHash: contractCall.hash,
          isInBlock: true,
          txTypeEvm: true,
          url: `https://${
            network === availableNetworks.mainnet ? '' : `${network.name}.`
          }reefscan.com/extrinsic/${contractCall.hash}`,
          addresses: [signer.address],
        });
      }
      // toast.success(`${token1.name}/${token2.name} supply added successfully!`);
    } catch (error) {
      const message = errorHandler(error.message)
        .replace('first', token1.name)
        .replace('second', token2.name);
      // toast.error(errorHandler(message));
      if (onTxUpdate) {
        onTxUpdate({
          txIdent,
          error: { message, code: TX_STATUS_ERROR_CODE.ERROR_UNDEFINED },
          txTypeEvm: true,
          addresses: [signer.address],
        });
      }
    } finally {
      /* TODO const newTokens = await loadTokens(tokens, sgnr);
      dispatch(setAllTokensAction(newTokens)); */

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
          onTokenSelect={changeToken1}
          onAddressChange={onAddressChangeLoad}
        />
        <SwitchTokenButton disabled addIcon />

        <TokenAmountField
          token={token2}
          tokens={tokens}
          signer={signer}
          id="add-liquidity-token-2"
          onAmountChange={setAmount2}
          onTokenSelect={changeToken2}
          onAddressChange={onAddressChangeLoad}
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

export default AddLiquidityComponent;
