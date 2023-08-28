import {
  reefState,
} from '@reef-chain/util-lib';
import { useEffect, useState } from 'react';
import { useObservableState } from './useObservableState';
import { availableNetworks, Network, ReefSigner } from '../state';
import { useProvider } from './useProvider';
import { accountsSubj } from '../appState/accountState';
import { useLoadSigners } from './useLoadSigners';
import { disconnectProvider } from '../utils/providerUtil';
import type { Signer as InjectedSigner } from '@polkadot/api/types';
import {
  _NFT_IPFS_RESOLVER_FN, initAxiosClients, setNftIpfsResolverFn, State, StateOptions,
} from '../appState/util';
import { ACTIVE_NETWORK_LS_KEY, setCurrentProvider } from '../appState/providerState';
import { useInjectExtension } from './useInjectExtension';
import { Provider } from '@reef-defi/evm-provider';
import { accountToSigner } from '../rpc';

const getNetworkFallback = (): Network => {
  let storedNetwork;
  try {
    storedNetwork = localStorage.getItem(ACTIVE_NETWORK_LS_KEY);
    storedNetwork = JSON.parse(storedNetwork);
    storedNetwork = availableNetworks[storedNetwork.name];
  } catch (e) {
    // when cookies disabled localStorage can throw
  }
  console.log("reefState===",reefState)
  return storedNetwork != null ? storedNetwork : availableNetworks.mainnet;
};

export const getReefSignersArray = async (
  extensionAccounts: any,
  provider: Provider,
): Promise<ReefSigner[]> => {
    const accountPromisses = extensionAccounts.flatMap(
      ({ accounts, name, sig }) => accounts.map((account) => accountToSigner(account, provider, sig, name)),
    );
    const accounts = await Promise.all(accountPromisses);
    return accounts as ReefSigner[];
};

export const reefAccountToReefSigner = (accountsFromUtilLib:any,injectedSigner:InjectedSigner)=>{
  // balance: BigNumber;
  const resultObj = {
    name:'reef',
    sig:injectedSigner,
  };
  let reefSigners = <any[]>[];
  for(let i = 0;i<accountsFromUtilLib?.data.length;i++){
    let reefAccount = accountsFromUtilLib.data[i].data;
    let toReefSigner = {
      name:reefAccount.name,
      address:reefAccount.address,
      source:reefAccount.source,
      genesisHash:reefAccount.genesisHash,
    };
    reefSigners.push(toReefSigner);
  }
  resultObj['accounts'] = reefSigners;
  return resultObj;
}

export const useInitReefState = (
  applicationDisplayName: string,
  options: StateOptions = {},
): State => {
  const {
    network, explorerClient, dexClient, signers, ipfsHashResolverFn,
  } = options;
  const [accounts, extension, loadingExtension, errExtension] = useInjectExtension(applicationDisplayName);
  const jsonAccounts = { accounts, injectedSigner: extension?.signer };
  console.log("ignore me ===",loadingExtension,errExtension);
  const selectedNetwork: Network|undefined = useObservableState(reefState.selectedNetwork$);
  const [provider, isProviderLoading] = useProvider((selectedNetwork as Network)?.rpcUrl);
  const [loadedSigners, isSignersLoading, error] = useLoadSigners(applicationDisplayName, signers ? undefined : provider, signers);
  const [loading, setLoading] = useState(false);
  const [loadedReefSigners, setLoadedReefSigners] = useState<ReefSigner[]>();
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

  let accountsFromUtilLib: any= useObservableState(reefState.accounts$);
  useEffect(()=>{
    if(accountsFromUtilLib==undefined || accountsFromUtilLib.data.length==0){
      reefState.setAccounts(jsonAccounts.accounts);
    }
  },[accountsFromUtilLib])

  if(provider){
    getReefSignersArray([reefAccountToReefSigner(accountsFromUtilLib,jsonAccounts.injectedSigner!)],provider!).then((val)=>{
      if(loadedReefSigners==undefined){
        setLoadedReefSigners(val)
      }
    });
  }

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
    accountsSubj.next(loadedReefSigners || []);
  }, [loadedReefSigners]);

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