import {Provider} from '@reef-defi/evm-provider';
import Uik from '@reef-defi/ui-kit';
import {Contract} from 'ethers';
import React, {useEffect, useState} from 'react';
import {ERC20} from '../../assets/abi/ERC20';
import {
  checkMinExistentialReefAmount,
  createEmptyTokenWithAmount,
  ensureExistentialReefAmount,
  ensureTokenAmount,
  isNativeTransfer,
  NotifyFun,
  ReefSigner,
  reefTokenWithAmount,
  Token,
  TokenWithAmount
} from '../../state';
import {
  ButtonStatus,
  calculateAmount,
  ensure,
  errorHandler,
  nativeTransfer,
  removeReefSpecificStringFromAddress
} from '../../utils';
import {AccountListModal} from '../AccountSelector/AccountListModal';
import {SwitchTokenButton} from '../common/Button';
import {Card, CardHeader, CardHeaderBlank, CardTitle, SubCard} from '../common/Card';
import {CenterColumn, ComponentCenter, MT} from '../common/Display';
import {DownIcon} from '../common/Icons';
import {Input} from '../common/Input';
import {LoadingButtonIconWithText} from '../common/Loading';
import {OpenModalButton} from '../common/Modal';
import {TokenAmountFieldMax} from '../TokenFields';
import SendConfirmationModal from './SendConfirmationModal';
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

const getSignerNativeAddress = async (evmAddress: string, provider: Provider): Promise<string> => {
  if (isNativeAddress(evmAddress)) {
    return evmAddress;
  }
  const address = await provider.api.query.evmAccounts.accounts(evmAddress);
  const addr = (address as any).toString();

  if (!addr) {
    throw new Error('Native address does not exist');
  }
  return addr;
};

function isNativeAddress(toAddress: string) {
  return toAddress.length === 48 && toAddress[0] === '5';
}

const sendStatus = (to: string, token: TokenWithAmount, signer: ReefSigner): ButtonStatus => {
  try {
    const toAddress = to.trim();
    ensure(toAddress.length !== 0, 'Missing destination address');
    ensure(toAddress.length === 42 || isNativeAddress(toAddress), 'Incorrect destination address');
    if (toAddress.startsWith('0x')) {
      ensure(signer.isEvmClaimed, 'Bind account');
    }
    ensure(token.amount !== '', 'Insert amount');
    ensureTokenAmount(token);
    ensureExistentialReefAmount(token, signer.balance);

    return { isValid: true, text: 'Confirm Send' };
  } catch (e) {
    return { isValid: false, text: e.message };
  }
};

export const Send = ({
  signer, tokens, accounts, provider,
}: Send): JSX.Element => {
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isAmountPristine, setAmountPristine] = useState(true);
  const [token, setToken] = useState(reefTokenWithAmount());

  useEffect(() => {
    const alignedToken = tokens.find(({ address }) => address === token.address);

    if (alignedToken) {
      setToken({ ...token, balance: alignedToken.balance });
    }
  }, [tokens]);

  const tokenContract = new Contract(token.address, ERC20, signer.signer);
  const { text, isValid } = sendStatus(to, token, signer);
  const existentialValidity = checkMinExistentialReefAmount(token, signer.balance);

  const onTokenSelect = (newToken: Token): void => setToken({ ...createEmptyTokenWithAmount(false), ...newToken });

  const onAmountChange = (amount: string, token: TokenWithAmount): void => {
    setToken({ ...token, amount: amount });
    setAmountPristine(false);
  };

  const onSend = async (): Promise<void> => {
    try {
      setLoading(true);
      ensureTokenAmount(token);
      ensureExistentialReefAmount(token, signer.balance);
      const amount = calculateAmount(token);

      if (isNativeTransfer(token)) {
        setStatus('Transfering native REEF');
        const nativeAddr = await getSignerNativeAddress(to, provider);
        await nativeTransfer(amount, nativeAddr, provider, signer);
      } else {
        setStatus('Extracting evm address');
        const toAddress = isNativeAddress(to)
          ? await getSignerEvmAddress(to, provider)
          : to;
        setStatus(`Transfering ${token.symbol}`);
        await tokenContract.transfer(toAddress, amount);
      }

      Uik.notify.success({
        message: 'Tokens transfered.\nBalances will reload after blocks are finalized',
        keepAlive: true,
      });

      Uik.dropConfetti();
    } catch (error) {
      const message = errorHandler(error.message)
      Uik.notify.danger({
        message: `There was an error while sending tokens: ${message}`,
        keepAlive: true,
      });
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
              onChange={(toVal: string) => setTo(removeReefSpecificStringFromAddress(toVal))}
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
          onAmountChange={(amt)=>onAmountChange(amt, token)}
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

            {!isAmountPristine && !existentialValidity.valid
              && (
                <div className="existential-error">
                  {existentialValidity.message}
                </div>
              )}
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
