// import { useEffect, useState } from 'react';
// import {
//   initReefState,
//   ipfsUrlResolverFn,
//   Network,
//   providerConnState$,
//   selectedNetworkProvider$,
// } from '@reef-chain/util-lib/dist/reefState';
// import { map } from 'rxjs';
// import { Provider } from '@reef-defi/evm-provider';
// import { InjectedExtension } from '@reef-defi/extension-inject/types';
// import { useInjectExtension } from './useInjectExtension';
// import { useObservableState } from './useObservableState';

// export interface State {
//   loading: boolean;
//   provider?: Provider;
//   network?: Network;
//   error?: any; // TODO!
//   extension?: InjectedExtension;
// }

// export const useInitReefState = (
//   applicationDisplayName: string,
//   options: {network?: Network; ipfsHashResolverFn?: ipfsUrlResolverFn;} = {},
// ): State => {
//   const [accounts, extension, loadingExtension, errExtension] = useInjectExtension(applicationDisplayName);
//   const { network: selectedNetwork, provider } = useObservableState(selectedNetworkProvider$);
//   const isProviderLoading = useObservableState(providerConnState$.pipe(map((v) => !v.isConnected)), false);

//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!accounts || !accounts.length || !extension) {
//       return;
//     }

//     const jsonAccounts = { accounts, injectedSigner: extension?.signer };
//     initReefState({
//       network: options.network,
//       jsonAccounts,
//       ipfsHashResolverFn: options.ipfsHashResolverFn,
//     });
//   }, [accounts, extension, options]);

//   useEffect(() => {
//     setLoading(loadingExtension && isProviderLoading);
//   }, [isProviderLoading, loadingExtension]);

//   return {
//     error: errExtension,
//     loading,
//     provider,
//     network: selectedNetwork,
//     extension,
//   };
// };

import {
  reefState,
} from '@reef-chain/util-lib';
import { useEffect, useState } from 'react';
import { useObservableState } from './useObservableState';
import { availableNetworks, Network } from '../state';
import { useProvider } from './useProvider';
import {
  ACTIVE_NETWORK_LS_KEY,
  setCurrentProvider,
} from '../appState/providerState';
import { accountsSubj } from '../appState/accountState';
import { useLoadSigners } from './useLoadSigners';
import { disconnectProvider } from '../utils/providerUtil';
import {
  _NFT_IPFS_RESOLVER_FN, initApolloClients, setNftIpfsResolverFn, State, StateOptions,
} from '../appState/util';

const getNetworkFallback = (): Network => {
  let storedNetwork;
  try {
    storedNetwork = localStorage.getItem(ACTIVE_NETWORK_LS_KEY);
    storedNetwork = JSON.parse(storedNetwork);
    storedNetwork = availableNetworks[storedNetwork.name];
  } catch (e) {
    // when cookies disabled localStorage can throw
  }
  return storedNetwork != null ? storedNetwork : availableNetworks.mainnet;
};

export const useInitReefState = (
  applicationDisplayName: string,
  options: StateOptions = {},
): State => {
  const {
    network, explorerClient, dexClient, signers, ipfsHashResolverFn,
  } = options;
  const selectedNetwork: Network|undefined = useObservableState(reefState.selectedNetwork$);
  const [provider, isProviderLoading] = useProvider((selectedNetwork as Network)?.rpcUrl);
  const [loadedSigners, isSignersLoading, error] = useLoadSigners(applicationDisplayName, signers ? undefined : provider, signers);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const newNetwork = network ?? getNetworkFallback();
    if (newNetwork !== selectedNetwork) {
      reefState.setSelectedNetwork(newNetwork);
    }
    reefState.selectedNetwork$.subscribe(network =>
      console.log("SELECTED NETWORK===", network)
    );
  }, [network]);

  useEffect(() => {
    setNftIpfsResolverFn(ipfsHashResolverFn);
  }, [ipfsHashResolverFn]);

  useEffect(() => {
    initApolloClients(selectedNetwork, explorerClient, dexClient);
  }, [selectedNetwork, explorerClient, dexClient]);

  useEffect(() => {
    if (provider) {
      setCurrentProvider(provider);
    }
    return () => {
      if (provider) {
        const disc = async (prov) => {
          await disconnectProvider(prov);
        };
        disc(provider);
      }
    };
  }, [provider]);

  useEffect(() => {
    accountsSubj.next(signers || loadedSigners || []);
  }, [loadedSigners, signers]);

  useEffect(() => {
    setLoading(isProviderLoading || isSignersLoading);
  }, [isProviderLoading, isSignersLoading]);
  console.log("error===",error);
  return {
    error,
    loading,
    provider,
    network: selectedNetwork,
    signers: loadedSigners,
  };
};