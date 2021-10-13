import React, { useState } from "react"
import {BigNumber} from "ethers";
import { useLoadPool } from "../../hooks/useLoadPool";
import { useUpdateBalance } from "../../hooks/useUpdateBalance";
import { useUpdateLiquidityAmount } from "../../hooks/useUpdateAmount";
import { useUpdateTokensPrice } from "../../hooks/useUpdateTokensPrice";
import { Token, Network, ReefSigner, Notify, TokenWithAmount, defaultSettings, createEmptyTokenWithAmount, reefTokenWithAmount, resolveSettings, rpc } from "../..";
import { ButtonStatus, ensure, calculateAmount, assertAmount, ensureAmount, calculateAmountWithPercentage, calculateDeadline, errorHandler, calculatePoolSupply } from "../../utils";


interface AddSupply {
  tokens: Token[];
  network: Network;
  signer?: ReefSigner;
  reloadTokens: () => void;
  notify: (message: string, type: Notify) => void;
  onAddressChangeLoad?: (address: string) => Promise<void>;
}

const addSupplyStatus = (token1: TokenWithAmount, token2: TokenWithAmount, isEvmClaimed?: boolean): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind account');
    ensure(!token1.isEmpty, 'Select first token');
    ensure(!token2.isEmpty, 'Select second token');
    ensure(token1.amount.length !== 0, 'Missing first token amount');
    ensure(token2.amount.length !== 0, 'Missing second token amount');
    ensure(BigNumber.from(calculateAmount(token1)).lte(token1.balance), `Insufficient ${token1.name} balance`);
    ensure(BigNumber.from(calculateAmount(token2)).lte(token2.balance), `Insufficient ${token2.name} balance`);
    return {
      isValid: true,
      text: 'Supply'
    };
  } catch (e) {
    return {
      isValid: false,
      text: e.message
    };
  }
}

const loadingStatus = (status: string, isPoolLoading: boolean, isPriceLoading: boolean): string => {
  if (status) { return status; }
  if (isPoolLoading) { return 'Loading pool'; }
  if (isPriceLoading) { return 'Loading prices'; }
  return '';
};

const AddSupply = ({
  tokens, network, signer, notify, reloadTokens,
  onAddressChangeLoad=async () => {}
} : AddSupply): JSX.Element => {

  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState(defaultSettings());
  const [isLiquidityLoading, setIsLiquidityLoading] = useState(false);

  const [token2, setToken2] = useState(createEmptyTokenWithAmount());
  const [token1, setToken1] = useState(reefTokenWithAmount());
  const { deadline, percentage } = resolveSettings(settings);

  const [pool, isPoolLoading] = useLoadPool(token1, token2, network.factoryAddress, signer?.signer);
  const newPoolSupply = calculatePoolSupply(token1, token2, pool);

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
  const { } = addSupplyStatus(token1, token2, signer?.isEvmClaimed);

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
    if (!signer) { return };
    const {evmAddress} = signer;
    try {
      setIsLiquidityLoading(true);
      ensureAmount(token1);
      ensureAmount(token2);

      setStatus(`Approving ${token1.name} token`);
      await rpc.approveTokenAmount(token1, network.routerAddress, signer.signer);
      setStatus(`Approving ${token2.name} token`);
      await rpc.approveTokenAmount(token2, network.routerAddress, signer.signer);

      setStatus('Adding supply');
      const reefswapRouter = rpc.getReefswapRouter(network.routerAddress, signer.signer);

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
    <div>

    </div>
  );
}

export default AddSupply;
