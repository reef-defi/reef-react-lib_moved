import {
  reefState,
} from '@reef-chain/util-lib';
import { useEffect, useState } from 'react';
import { useObservableState } from './useObservableState';
import { availableNetworks, Network, ReefSigner } from '../state';
import { accountsSubj, setCurrentAddress } from '../appState/accountState';
import type { Signer as InjectedSigner } from '@polkadot/api/types';
import {
  _NFT_IPFS_RESOLVER_FN, initAxiosClients, setNftIpfsResolverFn, State, StateOptions,
} from '../appState/util';
import { ACTIVE_NETWORK_LS_KEY } from '../appState/providerState';
import { useInjectExtension } from './useInjectExtension';
import { Provider } from '@reef-defi/evm-provider';
import { accountToSigner } from '../rpc';
import { useAsyncEffect } from './useAsyncEffect';

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

export const getReefSignersArray = (
  extensionAccounts: any,
  provider: Provider,
): [ReefSigner[],boolean] => {
  const [accounts, setAccounts] = useState<ReefSigner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
useAsyncEffect(async()=>{
  setIsLoading(true);
  const accountPromisses = extensionAccounts.flatMap(
    ({ accounts, name, sig }) => accounts.map((account) => accountToSigner(account, provider, sig, name)),
  );
  let _accounts = await Promise.all(accountPromisses);
  setAccounts(_accounts);
  try {
    setCurrentAddress(_accounts[0].address);
  } catch (error) {
    console.log("no accounts");
  }
  setIsLoading(false);
},[provider]);
  return [accounts,isLoading];
};

export const reefAccountToReefSigner = (accountsFromUtilLib:any,injectedSigner:InjectedSigner)=>{
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
    explorerClient, dexClient, ipfsHashResolverFn,
  } = options;
  const [accounts, extension, loadingExtension, errExtension] = useInjectExtension(applicationDisplayName);
  const jsonAccounts = { accounts, injectedSigner: extension?.signer };
  const selectedNetwork: Network|undefined = useObservableState(reefState.selectedNetwork$);
  const provider = useObservableState(reefState.selectedProvider$) as Provider|undefined;
  const [loading, setLoading] = useState(true);

  console.log("selectedNetwork ===",selectedNetwork);
  useEffect(() => {
    const network = getNetworkFallback();

    console.log({extension,accounts})
    if (!accounts || !accounts.length || !extension) {
      return;
    }

    const jsonAccounts = { accounts, injectedSigner: extension?.signer };
      reefState.initReefState({
        network,
        jsonAccounts,
        ipfsHashResolverFn,
      });
  }, [accounts, extension]);


  useEffect(() => {
    setNftIpfsResolverFn(ipfsHashResolverFn);
  }, [ipfsHashResolverFn]);

  useEffect(() => {
    initAxiosClients(selectedNetwork, explorerClient, dexClient);
  }, [selectedNetwork, explorerClient, dexClient]);

  let accountsFromUtilLib: any= useObservableState(reefState.accounts$);
  console.log(accountsFromUtilLib);

  const [loadedReefSigners,isLoadingReefSigners] = getReefSignersArray([reefAccountToReefSigner(accountsFromUtilLib,jsonAccounts.injectedSigner!)],provider!);
  console.log("loadedReefSigners === ",loadedReefSigners);
  useEffect(() => {
          accountsSubj.next(loadedReefSigners || []);
  }, [loadedReefSigners]);

  useEffect(() => {
    setLoading(isLoadingReefSigners||loadingExtension);

  }, [isLoadingReefSigners,loadedReefSigners,loadingExtension]);

  return {
    error:errExtension,
    loading,
    provider,
    network: selectedNetwork,
    signers: loadedReefSigners,
  };
};