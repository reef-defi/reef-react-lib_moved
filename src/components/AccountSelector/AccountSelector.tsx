import React, { useState, useMemo } from 'react';
import Uik from '@reef-chain/ui-kit';
import { ReefSigner } from '../../state';
import { toReefBalanceDisplay, trim } from '../../utils';
import './AccountSelector.css';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Account } from '@reef-chain/ui-kit/dist/ui-kit/components/organisms/AccountSelector/AccountSelector';

export type Network = 'mainnet' | 'testnet';
export type Language = 'en' | 'hi';

interface AccountSelector {
  accounts: ReefSigner[];
  selectedSigner?: ReefSigner;
  selectAccount: (index: number, signer: ReefSigner) => void;
  selectedNetwork?: Network;
  onNetworkSelect?: (network: Network) => any;
  onLanguageSelect?: (language: Language) => any;
  isBalanceHidden?: boolean;
  showBalance?: (...args: any[]) => any;
}

export const AccountSelector = ({
  selectedSigner,
  accounts,
  selectAccount,
  selectedNetwork,
  onNetworkSelect,
  onLanguageSelect,
  isBalanceHidden,
  showBalance,
}: AccountSelector): JSX.Element => {
  const name = selectedSigner ? selectedSigner.name : '';
  const balance = toReefBalanceDisplay(selectedSigner?.balance);

  const [isOpen, setOpen] = useState(false);

  const getAccounts = useMemo(() => {
    const allAccounts :Account[] = [];
    accounts.map(async (acc) => {
      const {
        name, address, evmAddress, source,
      } = acc;
      const isEvmClaimed = await acc.signer.isClaimed();
      allAccounts.push({
        name, address, evmAddress, source, isEvmClaimed,
      });
    });
    return allAccounts;
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    if (!selectedSigner?.address) return null;

    return {
      name: selectedSigner.name,
      address: selectedSigner.address,
      evmAddress: selectedSigner.evmAddress,
    };
  }, [selectedSigner]);

  const select = (account): void => {
    const acc = accounts.find((acc: ReefSigner) => acc.address === account.address);
    if (!acc) return;

    const index = accounts.indexOf(acc);
    selectAccount(index, acc);
    setOpen(false);
  };

  return (
    <div className="account-selector-box--nav">

      <div className="nav-account border-rad">
        <div className="my-auto mx-2 fs-6">
          {
          isBalanceHidden ? (
            <button
              type="button"
              className="nav-account__hidden-balance"
              onClick={showBalance}
            >
              <div />
              <div />
              <div />
              <div />
              <div />
            </button>
          ) : (
            <span className="nav-account__balance">{ balance }</span>
          )
        }
        </div>
        <button
          type="button"
          className="nav-account__account"
        >
          <span>{trim(name)}</span>
        </button>

        <Uik.AccountSelector
          isOpen={isOpen}
          onClose={() => setOpen(false)}
          accounts={getAccounts}
          selectedAccount={selectedAccount}
          onSelect={select}
          selectedNetwork={selectedNetwork}
          onNetworkSelect={onNetworkSelect}
          onLanguageSelect={onLanguageSelect}
        />
      </div>
      <button
        type="button"
        className="nav-account__gear"
        onClick={() => setOpen(true)}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>

    </div>
  );
};
