import Identicon from '@polkadot/react-identicon';
import { Provider } from '@reef-defi/evm-provider';
import Uik from '@reef-chain/ui-kit';
import BigNumber from 'bignumber.js';
import { Contract } from 'ethers';
import React, { useEffect, useMemo, useState } from 'react';
import { ERC20 } from '../../assets/abi/ERC20';
import {
  checkMinExistentialReefAmount, ensureExistentialReefAmount, ensureTokenAmount, isNativeTransfer,
  NotifyFun,
  ReefSigner,
  reefTokenWithAmount,
  Token,
  TokenWithAmount,
} from '../../state';
import {
  ButtonStatus,
  calculateAmount,
  ensure,
  errorHandler, fromReefEVMAddressWithNotification, nativeTransfer, shortAddress,
  showBalance,
} from '../../utils';
import '../PoolActions/pool-actions.css';
import TokenField from '../PoolActions/TokenField';
import './Send.css';
import SendPopup from '../PoolActions/ConfirmPopups/Send';

interface Send {
  tokens: Token[];
  signer: ReefSigner;
  provider: Provider;
  accounts: ReefSigner[];
  notify: NotifyFun;
  tokenAddress?: string;
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

function isNativeAddress(toAddress: string): boolean {
  return toAddress.length === 48 && toAddress[0] === '5';
}

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

const sendStatus = (to: string, token: TokenWithAmount, signer: ReefSigner): ButtonStatus => {
  try {
    const toAddress = to.trim();
    ensure(toAddress.length !== 0, 'Missing destination address');
    ensure(toAddress.length === 42 || isNativeAddress(toAddress), 'Incorrect destination address');
    if (toAddress.startsWith('0x')) {
      ensure(signer.isEvmClaimed, 'Bind account');
    }
    ensure(token.amount !== '', 'Insert amount');
    ensure(token.amount !== '0', 'Insert amount');
    ensureTokenAmount(token);
    ensureExistentialReefAmount(token, signer.balance);
    return { isValid: true, text: 'Send' };
  } catch (e) {
    return { isValid: false, text: e.message };
  }
};

const Accounts = ({
  accounts,
  selectAccount,
  isOpen,
  onClose,
  query,
  selectedAccount,
}: {
  accounts: ReefSigner[];
  selectAccount: (index: number, signer: ReefSigner) => void;
  isOpen: boolean;
  onClose: () => void;
  query: string;
  selectedAccount: ReefSigner;
}): JSX.Element => {
  const getAccounts = useMemo(() => {
    const list = accounts.filter(({ address }) => selectedAccount.address !== address);

    if (!query) return list;

    const perfectMatch = list.find((acc) => acc.address === query);
    if (perfectMatch) {
      return [
        perfectMatch,
        ...list.filter((acc) => acc.address !== query),
      ];
    }

    return list.filter((acc) => acc.address.toLowerCase().startsWith(query.toLowerCase())
        || acc.name.replaceAll(' ', '').toLowerCase().startsWith(query.toLowerCase()));
  }, [accounts, query]);

  return (
    <div className="send-accounts">
      <Uik.Dropdown
        isOpen={isOpen}
        onClose={onClose}
      >
        {
          getAccounts.map((account, index) => (
            <Uik.DropdownItem
              key={`account-${index}`}
              className={`
                send-accounts__account
                ${account.address === query ? 'send-accounts__account--selected' : ''}
              `}
              onClick={() => selectAccount(index, account)}
            >
              <Identicon className="send-accounts__account-identicon" value={account.address} size={44} theme="substrate" />
              <div className="send-accounts__account-info">
                <div className="send-accounts__account-name">{ account.name }</div>
                <div className="send-accounts__account-address">{ shortAddress(account.address) }</div>
              </div>
            </Uik.DropdownItem>
          ))
        }
      </Uik.Dropdown>
    </div>
  );
};

export const Send = ({
  signer, tokens, accounts, provider, tokenAddress,
}: Send): JSX.Element => {
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('Send');
  const [isLoading, setLoading] = useState(false);
  const [isAmountPristine, setAmountPristine] = useState(true);

  const getInitToken = (): TokenWithAmount => {
    if (tokenAddress) {
      const targetToken = tokens.find(({ address }) => address === tokenAddress);
      if (targetToken) {
        return {
          ...targetToken, isEmpty: false, price: 0, amount: '',
        };
      }
    }

    return reefTokenWithAmount();
  };

  const [token, setToken] = useState(getInitToken());

  useEffect(() => {
    const alignedToken = tokens.find(({ address }) => address === token.address);

    if (alignedToken) {
      setToken({ ...token, balance: alignedToken.balance });
    }
  }, [tokens]);

  const tokenContract = new Contract(token.address, ERC20, signer.signer);
  const { isValid, text } = sendStatus(to, token, signer);
  const existentialValidity = checkMinExistentialReefAmount(token, signer.balance);

  const onAmountChange = (amount: string, token: TokenWithAmount): void => {
    setToken({ ...token, amount });
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
      const message = errorHandler(error.message);
      Uik.prompt({
        type: 'danger',
        title: 'Transaction has failed',
        message: `There was an error while sending tokens: ${message}\nYour assets remain unchanged.`,
        actions: <Uik.Button text="Close" danger />,
      });
    } finally {
      setLoading(false);
      setToken({ ...token, amount: '' });
    }
  };

  const [isAccountListOpen, setAccountsListOpen] = useState(false);

  const closeAccountsList = (): void => {
    const close = (): void => {
      setAccountsListOpen(false);
      document.removeEventListener('mouseup', close);
    };

    document.addEventListener('mouseup', close);
  };

  const maxAmount = useMemo((): number => Math.floor(
    new BigNumber(
      showBalance(token)
        .replace(` ${token.symbol}`, '')
        .replace(` ${token.name}`, ''),
    ).toNumber(),
  ), [token]);

  const percentage = useMemo((): number => {
    let percentage = new BigNumber(token.amount || 0).times(100).dividedBy(maxAmount).toNumber();
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    return percentage;
  }, [token.amount, maxAmount]);

  const setPercentage = (perc): void => {
    const amount = new BigNumber(perc).times(maxAmount).dividedBy(100).toNumber();
    onAmountChange(String(amount), token);
  };

  const [isPopupOpen, setPopupOpen] = useState(false);

  return (
    <div className="send">
      <div className="send__address">
        <Identicon className="send__address-identicon" value={to} size={46} theme="substrate" />

        <input
          className="send__address-input"
          value={to}
          maxLength={70}
          onChange={(event) => setTo(fromReefEVMAddressWithNotification(event.target.value))}
          placeholder="Send to address"
          disabled={isLoading}
          onFocus={() => setAccountsListOpen(true)}
          onBlur={closeAccountsList}
        />

        <Accounts
          isOpen={isAccountListOpen}
          onClose={() => setAccountsListOpen(false)}
          accounts={accounts}
          query={to}
          selectAccount={(_, signer) => setTo(signer.address)}
          selectedAccount={signer}
        />
      </div>

      <div className="uik-pool-actions__tokens">
        <TokenField
          token={token}
          tokens={tokens}
          onAmountChange={(amt) => onAmountChange(amt, token)}
        />
      </div>

      {
        !isAmountPristine
        && !existentialValidity.valid && (
          <div className="send__error">
            {existentialValidity.message}
          </div>
        )
      }

      <div className="uik-pool-actions__slider">
        <Uik.Slider
          className="send__slider"
          value={percentage}
          onChange={setPercentage}
          tooltip={`${Uik.utils.maxDecimals(percentage, 2)}%`}
          helpers={[
            { position: 0, text: '0%' },
            { position: 25 },
            { position: 50, text: '50%' },
            { position: 75 },
            { position: 100, text: '100%' },
          ]}
        />
      </div>

      <Uik.Button
        size="large"
        className="uik-pool-actions__cta"
        fill
        loading={isLoading}
        disabled={isLoading || !isValid}
        text={isLoading ? status : text}
        onClick={() => setPopupOpen(true)}
      />

      <SendPopup
        address={to}
        isOpen={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        onConfirm={onSend}
        token={token}
      />
    </div>
  );
};
