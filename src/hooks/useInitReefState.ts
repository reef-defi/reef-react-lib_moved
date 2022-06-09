import { useEffect, useState } from 'react';
import { useObservableState } from './useObservableState';
import { availableNetworks, Network } from '../state';
import { useProvider } from './useProvider';
import { currentNetwork$, setCurrentNetwork, setCurrentProvider, } from '../appState/providerState';
import { accountsSubj } from '../appState/accountState';
import { useLoadSigners } from './useLoadSigners';
import { disconnectProvider } from '../utils/providerUtil';
import { initApolloClient, State, StateOptions } from '../appState/util';

/*
const getGQLUrls = (network: Network): { ws: string; http: string }|undefined => {
  if (!network.graphqlUrl) {
    return undefined;
  }
  const ws = network.graphqlUrl.startsWith('http')
    ? network.graphqlUrl.replace('http', 'ws')
    : network.graphqlUrl;
  const http = network.graphqlUrl.startsWith('ws')
    ? network.graphqlUrl.replace('ws', 'http')
    : network.graphqlUrl;
  return { ws, http };
};
// export type UseInitReefState = [ReefSigner[] | undefined, Provider | undefined, Network | undefined, boolean, any];

interface State {
  loading: boolean;
  signers?: ReefSigner[];
  provider?: Provider;
  network?: Network;
  error?: any; // TODO!
}

interface StateOptions {
  network: Network;
  signers?: ReefSigner[];
  client?: ApolloClient<any>;
}*/
export const useInitReefState = (
  applicationDisplayName: string,
  {
    network = availableNetworks.mainnet,
    client,
    signers,
  }: StateOptions,
): State => {
  const selectedNetwork: Network|undefined = useObservableState(currentNetwork$);
  const [provider, isProviderLoading] = useProvider((selectedNetwork as Network)?.rpcUrl);
  const [loadedSigners, isSignersLoading, error] = useLoadSigners(applicationDisplayName, signers ? undefined : provider);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (network && network !== selectedNetwork) {
      setCurrentNetwork(network);
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
