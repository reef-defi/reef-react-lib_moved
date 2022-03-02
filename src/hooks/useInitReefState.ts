import { useEffect, useState } from 'react';
import { Provider } from '@reef-defi/evm-provider';
import { useObservableState } from './useObservableState';
import { Network, ReefSigner } from '../state';
import { useProvider } from './useProvider';
import {
  providerSubj,
  selectedNetworkSubj,
  setCurrentNetwork,
} from '../appState/providerState';
import { setApolloUrls } from '../graphql';
import { accountsSubj } from '../appState/accountState';
import { useLoadSigners } from './useLoadSigners';

const getGQLUrls = (network: Network): { ws: string; http: string } => {
  const ws = network.graphqlUrl.startsWith('http')
    ? network.graphqlUrl.replace('http', 'ws')
    : network.graphqlUrl;
  const http = network.graphqlUrl.startsWith('ws')
    ? network.graphqlUrl.replace('ws', 'http')
    : network.graphqlUrl;
  return { ws, http };
};
export type UseInitReefState = [ReefSigner[] | undefined, Provider | undefined, Network | undefined, boolean, any];
export const useInitReefState = (
  selectNetwork: Network,
  applicationDisplayName: string,
): UseInitReefState => {
  const selectedNetwork: Network|undefined = useObservableState(selectedNetworkSubj);
  const [provider, isProviderLoading] = useProvider((selectedNetwork as Network)?.rpcUrl);
  const [signers, isSignersLoading, error] = useLoadSigners(applicationDisplayName, provider);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectNetwork !== selectedNetwork) {
      setCurrentNetwork(selectNetwork);
    }
  }, [selectNetwork]);

  useEffect(() => {
    if (selectedNetwork) {
      const gqlUrls = getGQLUrls(selectedNetwork);
      setApolloUrls(gqlUrls);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (provider) {
      providerSubj.next(provider);
    }
    return () => {
      provider?.api.disconnect();
    };
  }, [provider]);

  useEffect(() => {
    // dispatch(setProviderLoading(isProviderLoading));
  }, [isProviderLoading]);

  useEffect(() => {
    accountsSubj.next(signers || []);
  }, [signers]);

  useEffect(() => {
    setLoading(isProviderLoading || isSignersLoading);
  }, [isProviderLoading, isSignersLoading]);
  return [signers, provider, selectedNetwork, loading, error];
};
