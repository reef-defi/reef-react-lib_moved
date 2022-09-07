import React, { useState, useMemo } from 'react';
import Uik from '@reef-defi/ui-kit';
import { ReefSigner } from '../../state';
import { toReefBalanceDisplay, trim } from '../../utils';
import { WalletIcon } from '../common/Icons';
import './AccountSelector.css';

interface AccountSelector {
  accounts: ReefSigner[];
  selectedSigner?: ReefSigner;
  selectAccount: (index: number, signer: ReefSigner) => void;
}

export const AccountSelector = ({
  selectedSigner,
  accounts,
  selectAccount,
}: AccountSelector): JSX.Element => {
  const name = selectedSigner ? selectedSigner.name : '';
  const balance = toReefBalanceDisplay(selectedSigner?.balance);

  const [isOpen, setOpen] = useState(false);

  const getAccounts = useMemo(() => accounts.map((account) => ({
    name: account.name,
    address: account.address,
    evmAddress: account.evmAddress,
  })), [accounts]);

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
    <div className="nav-account border-rad">
      <div className="my-auto mx-2 fs-6">
        {balance}
      </div>
      <button
        type="button"
        className="btn btn-reef border-rad"
        onClick={() => setOpen(true)}
      >
        <WalletIcon />
        <span>{trim(name)}</span>
      </button>

      <Uik.AccountSelector
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        accounts={getAccounts}
        selectedAccount={selectedAccount}
        onSelect={select}
      />
    </div>
  );
};
