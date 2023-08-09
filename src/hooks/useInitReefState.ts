import { useEffect, useState } from 'react';
import {
  initReefState,
  Network,
  providerConnState$,
  selectedNetworkProvider$,
  StateOptions,
} from '@reef-chain/util-lib/dist/reefState';
import { map } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import { useObservableState } from './useObservableState';

export interface State {
  loading: boolean;
  provider?: Provider;
  network?: Network;
  error?: any; // TODO!
}

export const useInitReefState = (
  _applicationDisplayName: string,
  options: StateOptions = {},
): State => {
  const { network: selectedNetwork, provider } = useObservableState(selectedNetworkProvider$);
  const isProviderLoading = useObservableState(providerConnState$.pipe(map((v) => !v.isConnected)), false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const destroyConnFn = initReefState({
      network: options.network,
      jsonAccounts: options.jsonAccounts,
      ipfsHashResolverFn: options.ipfsHashResolverFn,
    });
    return destroyConnFn;
  }, []);

  useEffect(() => {
    setLoading(isProviderLoading);
  }, [isProviderLoading]);
  return {
    loading,
    provider,
    network: selectedNetwork,
  };
};
