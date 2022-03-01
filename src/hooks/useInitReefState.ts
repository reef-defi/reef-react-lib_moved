import { useEffect } from 'react';
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

const getGQLUrls = (network: Network): { ws: string; http: string } => {
  const ws = network.graphqlUrl.startsWith('http')
    ? network.graphqlUrl.replace('http', 'ws')
    : network.graphqlUrl;
  const http = network.graphqlUrl.startsWith('ws')
    ? network.graphqlUrl.replace('ws', 'http')
    : network.graphqlUrl;
  return { ws, http };
};

export const useInitReefState = (
  signers: ReefSigner[],
  selectNetwork: Network,
): void => {
  const network = useObservableState(selectedNetworkSubj);
  const provArr = useProvider((network as Network)?.rpcUrl);
  const [provider, isProviderLoading] = provArr;

  useEffect(() => {
    setCurrentNetwork(selectNetwork);
    const gqlUrls = getGQLUrls(selectNetwork);
    setApolloUrls(gqlUrls);
  }, [selectNetwork]);

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
};
