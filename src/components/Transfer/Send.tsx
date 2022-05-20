import React, { useEffect, useState } from 'react';
import { Contract } from 'ethers';
import { Provider } from '@reef-defi/evm-provider';
import {
  createEmptyTokenWithAmount, ensureTokenAmount, NotifyFun, ReefSigner, reefTokenWithAmount, Token, TokenWithAmount,
} from '../../state';
import { Input } from '../common/Input';
import {
  Card, CardHeaderBlank, SubCard, CardHeader, CardTitle,
} from '../common/Card';
import { CenterColumn, ComponentCenter, MT } from '../common/Display';
import { OpenModalButton } from '../common/Modal';
import SendConfirmationModal from './SendConfirmationModal';
import { TokenAmountFieldMax } from '../TokenFields';
import { LoadingButtonIconWithText } from '../common/Loading';
import { ERC20 } from '../../assets/abi/ERC20';
import {
  ButtonStatus, calculateAmount, ensure, nativeTransfer, REEF_ADDRESS,
} from '../../utils';
import { AccountListModal } from '../AccountSelector/AccountListModal';
import { SwitchTokenButton } from '../common/Button';
import { DownIcon } from '../common/Icons';
import './Send.css';

interface Send {
  tokens: Token[];
  signer: ReefSigner;
  provider: Provider;
  accounts: ReefSigner[];

  notify: NotifyFun;
}

const getSignerEvmAddress = async (address: string, provider: Provider): Promise<string> => {
  if (address.length !== 48 || address[0] !== '5') {
    return address;
  }
  const evmAddress = await provider.api.query.evmAccounts.evmAddresses(address);
  const addr = (evmAddress as any).toString();

  if (!addr) {
    throw new Error('EVM address does not exist');
  }
  return addr;
};

const sendStatus = (to: string, token: TokenWithAmount, signer: ReefSigner): ButtonStatus => {
  try {
    const toAddress = to.trim();
    ensure(toAddress.length !== 0, 'Missing destination address');
    ensure(toAddress.length === 42 || (toAddress.length === 48 && toAddress[0] === '5'), 'Incorrect destination address');
    if (toAddress.startsWith('0x')) {
      ensure(signer.isEvmClaimed, 'Bind account');
    }
    ensure(token.amount !== '', 'Insert amount');
    ensureTokenAmount(token);

    return { isValid: true, text: 'Confirm Send' };
  } catch (e) {
    return { isValid: false, text: e.message };
  }
};

export const Send = ({
  signer, tokens, accounts, provider, notify,
}: Send): JSX.Element => {
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setLoading] = useState(false);

  const [token, setToken] = useState(reefTokenWithAmount());

  useEffect(() => {
    const alignedToken = tokens.find(({ address }) => address === token.address);

    if (alignedToken) {
      setToken({ ...token, balance: alignedToken.balance });
    }
  }, [tokens]);

  const tokenContract = new Contract(token.address, ERC20, signer.signer);
  const { text, isValid } = sendStatus(to, token, signer);

  const onTokenSelect = (newToken: Token): void => setToken({ ...createEmptyTokenWithAmount(false), ...newToken });

  const onAmountChange = (amount: string): void => setToken({ ...token, amount });

  const onSend = async (): Promise<void> => {
    try {
      setLoading(true);
      ensureTokenAmount(token);
      const amount = calculateAmount(token);

      if (token.address === REEF_ADDRESS && to.length === 48) {
        setStatus('Transfering native REEF');
        await nativeTransfer(amount, to, provider, signer);
      } else {
        setStatus('Extracting evm address');
        const toAddress = to.length === 48
          ? await getSignerEvmAddress(to, provider)
          : to;
        setStatus(`Transfering ${token.symbol}`);
        await tokenContract.transfer(toAddress, amount);
      }

      notify('Balances will reload after blocks are finalized.', 'info');
      notify('Tokens sent successfully!');
    } catch (e) {
      console.error(e);
      notify(`There was an error while sending tokens: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCenter>
      <Card>
        <CardHeader>
          <CardHeaderBlank />
          <CardTitle title="Send Tokens" />
          <CardHeaderBlank />
        </CardHeader>
        <SubCard>
          <MT size="1" />
          <div className="input-group">
            <Input
              value={to}
              maxLength={70}
              onChange={(toVal: string) => setTo(toVal.trim())}
              placeholder="Send to address"
              disabled={isLoading}
            />
            <div className="input-group-append">
              <span className="input-group-text p-0 h-100" id="basic-addon2">
                <OpenModalButton
                  id="selectMyAddress"
                  disabled={isLoading}
                  // TODO add custom css class for border radious insted of rounded
                  className="btn btn-reef btn-outline-secondary rounded px-3 h-100"
                >
                  <DownIcon small />
                </OpenModalButton>
              </span>
            </div>
          </div>
          <MT size="2" />
        </SubCard>
        <SwitchTokenButton disabled addIcon />
        <TokenAmountFieldMax
          onTokenSelect={onTokenSelect}
          onAmountChange={onAmountChange}
          signer={signer}
          token={token}
          tokens={tokens}
        />

        <MT size="2">
          <CenterColumn>
            <OpenModalButton id="send-confirmation-modal-toggle" disabled={isLoading || !isValid}>
              {isLoading
                ? (<LoadingButtonIconWithText text={status} />)
                : (text)}
            </OpenModalButton>
          </CenterColumn>
        </MT>

        <SendConfirmationModal
          to={to}
          token={token}
          confirmFun={onSend}
          id="send-confirmation-modal-toggle"
        />

        <AccountListModal
          id="selectMyAddress"
          accounts={accounts}
          selectAccount={(_, signer) => setTo(signer.address)}
          title="Select Account"
        />
      </Card>
    </ComponentCenter>
  );
};
