import { Provider } from '@reef-defi/evm-provider';
import { useEffect, useState } from 'react';
import { DeriveBalancesAccountData } from '@polkadot/api-derive/balances/types';

// This hook is used to retrieve account reef balance even if the account address was not claimed
export const useUpdateAccountBalance = (
  address?: string,
  provider?: Provider,
): string => {
  const [balance, setBalance] = useState('-');

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!provider || !address) {
        return;
      }
      Promise.resolve()
        .then(() => provider.api.derive.balances.all(address))
        .then((res: DeriveBalancesAccountData) => res.freeBalance.toHuman())
        .then((balance) => (balance === '0' ? '0 REEF' : balance))
        .then(setBalance);
    };

    const interval = setInterval(() => load(), 1000);
    return () => clearInterval(interval);
  }, [provider, address]);

  return balance;
};