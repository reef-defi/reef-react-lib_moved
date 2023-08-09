import { useEffect, useState } from 'react';
import {
  initReefState,
  ipfsUrlResolverFn,
  Network,
  providerConnState$,
  selectedNetworkProvider$,
} from '@reef-chain/util-lib/dist/reefState';
import { map } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import { InjectedExtension } from '@reef-defi/extension-inject/types';
import { useInjectExtension } from './useInjectExtension';
import { useObservableState } from './useObservableState';

export interface State {
  loading: boolean;
  provider?: Provider;
  network?: Network;
  error?: any; // TODO!
  extension?: InjectedExtension;
}

export const useInitReefState = (
  applicationDisplayName: string,
  options: {network?: Network; ipfsHashResolverFn?: ipfsUrlResolverFn;} = {},
): State => {
  const [accounts, extension, loadingExtension, errExtension] = useInjectExtension(applicationDisplayName);
  const { network: selectedNetwork, provider } = useObservableState(selectedNetworkProvider$);
  const isProviderLoading = useObservableState(providerConnState$.pipe(map((v) => !v.isConnected)), false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accounts || !accounts.length || !extension) {
      return;
    }

    const jsonAccounts = { accounts, injectedSigner: extension?.signer };
    initReefState({
      network: options.network,
      jsonAccounts,
      ipfsHashResolverFn: options.ipfsHashResolverFn,
    });
  }, [accounts, extension, options]);

  useEffect(() => {
    setLoading(loadingExtension && isProviderLoading);
  }, [isProviderLoading, loadingExtension]);

  return {
    error: errExtension,
    loading,
    provider,
    network: selectedNetwork,
    extension,
  };
};
