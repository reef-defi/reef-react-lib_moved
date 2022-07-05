import { useEffect, useState } from 'react';
import { useObservableState } from './useObservableState';
import { availableNetworks, Network } from '../state';
import { useProvider } from './useProvider';
import {
  ACTIVE_NETWORK_LS_KEY,
  currentNetwork$,
  setCurrentNetwork,
  setCurrentProvider,
} from '../appState/providerState';
import { accountsSubj } from '../appState/accountState';
import { useLoadSigners } from './useLoadSigners';
import { disconnectProvider } from '../utils/providerUtil';
import { initApolloClient, State, StateOptions } from '../appState/util';

const getNetworkFallback = (): Network => {
  let storedNetwork;
  try{
    storedNetwork = localStorage.getItem(ACTIVE_NETWORK_LS_KEY);
  }catch (e) {
    // when cookies disabled localStorage can throw
  }
  return storedNetwork != null ? JSON.parse(storedNetwork) : availableNetworks.mainnet;
};

export const useInitReefState = (
  applicationDisplayName: string,
  options: StateOptions = {},
): State => {
  const { network, client, signers } = options;
  const selectedNetwork: Network|undefined = useObservableState(currentNetwork$);
  const [provider, isProviderLoading] = useProvider((selectedNetwork as Network)?.rpcUrl);
  const [loadedSigners, isSignersLoading, error] = useLoadSigners(applicationDisplayName, signers ? undefined : provider, signers);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const newNetwork = network ?? getNetworkFallback();
    if (newNetwork !== selectedNetwork) {
      setCurrentNetwork(newNetwork);
    }
  }, [network]);

  useEffect(() => {
    initApolloClient(selectedNetwork, client);
  }, [selectedNetwork, client]);

  useEffect(() => {
    if (provider) {
      setCurrentProvider(provider);
    }
    return () => {
      if(provider){
        const disc = async(prov) => {
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

  return {
    error,
    loading,
    provider,
    network: selectedNetwork,
    signers: loadedSigners,
  };
};
