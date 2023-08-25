import {
  reefState,
} from '@reef-chain/util-lib';
import { useEffect, useState } from 'react';
import { useObservableState } from './useObservableState';
import { availableNetworks, Network } from '../state';
import { accountsSubj } from '../appState/accountState';
import { useLoadSigners } from './useLoadSigners';
import {
  _NFT_IPFS_RESOLVER_FN, initAxiosClients, setNftIpfsResolverFn, State, StateOptions,
} from '../appState/util';
import { ACTIVE_NETWORK_LS_KEY } from '../appState/providerState';
import { Provider } from '@reef-defi/evm-provider';

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
  console.log("reefState===",reefState)
  const selectedNetwork: Network|undefined = useObservableState(reefState.selectedNetwork$);
  // const [provider, isProviderLoading] = useProvider((selectedNetwork as Network)?.rpcUrl);
  const provider:Provider = useObservableState(reefState.selectedProvider$);
  console.log(provider);
  const [loadedSigners, isSignersLoading, error] = useLoadSigners(applicationDisplayName, signers ? undefined : provider, signers);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const newNetwork = network ?? getNetworkFallback();
    if (newNetwork !== selectedNetwork) {
      reefState.setSelectedNetwork(newNetwork);
    }
  }, [network]);

  useEffect(() => {
    setNftIpfsResolverFn(ipfsHashResolverFn);
  }, [ipfsHashResolverFn]);

  useEffect(() => {
    initAxiosClients(selectedNetwork, explorerClient, dexClient);
  }, [selectedNetwork, explorerClient, dexClient]);

  

  useEffect(() => {
    accountsSubj.next(signers || loadedSigners || []);
  }, [loadedSigners, signers]);

  useEffect(() => {
    setLoading( isSignersLoading);
  }, [isSignersLoading]);
  return {
    error,
    loading,
    provider,
    network: selectedNetwork,
    signers: loadedSigners,
  };
};