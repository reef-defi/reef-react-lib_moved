import { ContractInterface } from 'ethers';
import { Provider } from '@reef-defi/evm-provider';
import { ApolloClient } from '@apollo/client';
import {
  defer, finalize, Observable, scan, switchMap, tap,
} from 'rxjs';
import type { Signer as InjectedSigningKey } from '@polkadot/api/types';
import { AccountJson } from '@reef-defi/extension-base/background/types';
import type { InjectedAccountWithMeta as InjectedAccountWithMetaReef } from '@reef-defi/extension-inject/types';
import type {
  InjectedAccountWithMeta,
} from '@polkadot/extension-inject/types';
import { ContractType, Token, TokenWithAmount } from '../state/token';
import {
  accountsJsonSigningKeySubj, accountsJsonSubj, accountsSubj, reloadSignersSubj,
} from './accountState';
import { UpdateAction } from './updateStateModel';
import {
  availableNetworks, Network, ReefSigner,
} from '../state';
import { calculateTokenPrice, disconnectProvider, TxStatusUpdate } from '../utils';
import { ERC20 } from '../assets/abi/ERC20';
import { ERC721Uri } from '../assets/abi/ERC721Uri';
import { ERC1155Uri } from '../assets/abi/ERC1155Uri';
import { initProvider } from '../utils/providerUtil';
import { currentNetwork$, setCurrentNetwork, setCurrentProvider } from './providerState';
import {
  apolloDexClientSubj, apolloExplorerClientSubj, GQLUrl, setApolloDexUrls, setApolloExplorerUrls,
} from '../graphql';
import { ipfsUrlResolverFn } from '../utils/nftUtil';
import { PoolReserves } from '../graphql/pools';

type destroyConnection = ()=>void;

type GQLUrlType = 'explorer' | 'dex';

// eslint-disable-next-line import/no-mutable-exports
export let _NFT_IPFS_RESOLVER_FN: ipfsUrlResolverFn|undefined;

export const setNftIpfsResolverFn = (val?: ipfsUrlResolverFn):void => {
  _NFT_IPFS_RESOLVER_FN = val;
};

export const combineTokensDistinct = ([tokens1, tokens2]: [
  Token[],
  Token[]
]): Token[] => {
  const combinedT = [...tokens1];
  // console.log('COMBINED=', combinedT);
  tokens2.forEach((vT: Token) => (!combinedT.some((cT) => cT.address === vT.address)
    ? combinedT.push(vT)
    : null));
  // console.log('1111COMBINED=', combinedT);
  return combinedT;
};

export const toTokensWithPrice = ([tokens, reefPrice, pools]: [
  Token[],
  number,
  PoolReserves[]
]): TokenWithAmount[] => tokens.map(
  (token) => ({
    ...token,
    price: calculateTokenPrice(token, pools, reefPrice),
  } as TokenWithAmount),
);

export const onTxUpdateResetSigners = (
  txUpdateData: TxStatusUpdate,
  updateActions: UpdateAction[],
): void => {
  if (txUpdateData?.isInBlock || txUpdateData?.error) {
    const delay = txUpdateData.txTypeEvm ? 2000 : 0;
    setTimeout(() => reloadSignersSubj.next({ updateActions }), delay);
  }
};

export const getContractTypeAbi = (contractType: ContractType): ContractInterface => {
  switch (contractType) {
    case ContractType.ERC20:
      return ERC20;
    case ContractType.ERC721:
      return ERC721Uri;
    case ContractType.ERC1155:
      return ERC1155Uri;
    default:
      return [] as ContractInterface;
  }
};

export const getGQLUrls = (network: Network): Map<GQLUrlType, GQLUrl> => {
  const gqlUrls = new Map();
  if (!network.graphqlExplorerUrl) {
    return gqlUrls;
  }

  const wsExplorer = network.graphqlExplorerUrl.startsWith('http')
    ? network.graphqlExplorerUrl.replace('http', 'ws')
    : network.graphqlExplorerUrl;
  const httpExplorer = network.graphqlExplorerUrl.startsWith('ws')
    ? network.graphqlExplorerUrl.replace('ws', 'http')
    : network.graphqlExplorerUrl;
  gqlUrls.set('explorer', {
    http: httpExplorer,
    ws: wsExplorer,
  });

  const wsDex = network.graphqlDexsUrl.startsWith('http')
    ? network.graphqlDexsUrl.replace('http', 'ws')
    : network.graphqlDexsUrl;
  const httpDex = network.graphqlDexsUrl.startsWith('ws')
    ? network.graphqlDexsUrl.replace('ws', 'http')
    : network.graphqlDexsUrl;
  gqlUrls.set('dex', {
    http: httpDex,
    ws: wsDex,
  });

  return gqlUrls;
};

export interface State {
  loading: boolean;
  signers?: ReefSigner[];
  provider?: Provider;
  network?: Network;
  error?: any; // TODO!
}

export interface StateOptions {
  network?: Network;
  signers?: ReefSigner[];
  explorerClient?: ApolloClient<any>;
  dexClient?: ApolloClient<any>;
  jsonAccounts?:{accounts: AccountJson[] | InjectedAccountWithMeta[] | InjectedAccountWithMetaReef[], injectedSigner: InjectedSigningKey}
  ipfsHashResolverFn?: ipfsUrlResolverFn;
}

export function initApolloClients(selectedNetwork?: Network, explorerClient?: ApolloClient<any>, dexClient?: ApolloClient<any>): void {
  if (selectedNetwork) {
    if (!explorerClient && !dexClient) {
      const gqlUrls = getGQLUrls(selectedNetwork);
      if (gqlUrls) {
        if (gqlUrls.get('explorer')) {
          setApolloExplorerUrls(gqlUrls.get('explorer')!);
        }
        if (gqlUrls.get('dex')) {
          setApolloDexUrls(gqlUrls.get('dex')!);
        }
      }
    } else {
      if (explorerClient) {
        apolloExplorerClientSubj.next(explorerClient);
      }
      if (dexClient) {
        apolloDexClientSubj.next(dexClient);
      }
    }
  }
}

function finalizeWithValue<T>(callback: (value: T) => void) {
  return (source: Observable<T>) => defer(() => {
    let lastValue: T;
    return source.pipe(
      tap((value) => {
        lastValue = value;
      }),
      finalize(() => callback(lastValue)),
    );
  });
}

export const initReefState = (
  {
    network,
    explorerClient,
    dexClient,
    signers,
    jsonAccounts,
    ipfsHashResolverFn,
  }: StateOptions,
): destroyConnection => {
  const subscription = currentNetwork$.pipe(
    switchMap((network) => initProvider(network.rpcUrl)
      .then((provider) => ({
        provider,
        network,
      }))),
    scan((state: { provider: Provider }, newVal: { provider: Provider, network }) => {
      if (state.provider) {
        disconnectProvider(state.provider);
      }
      return { provider: newVal.provider, network: newVal.network };
    }, {}),
    tap((p_n: { provider: Provider, network: Network }) => {
      setCurrentProvider(p_n.provider);
    }),
    tap((p_n) => {
      initApolloClients(p_n.network, explorerClient, dexClient);
    }),
    finalizeWithValue(((p_n) => disconnectProvider(p_n.provider))),
  )
    .subscribe({
      error: (e) => {
        console.log('initReefState ERR=', e);
      },
    });
  setCurrentNetwork(network || availableNetworks.mainnet);
  setNftIpfsResolverFn(ipfsHashResolverFn);
  if (signers) {
    accountsSubj.next(signers || null);
  }
  if (jsonAccounts) {
    accountsJsonSigningKeySubj.next(jsonAccounts.injectedSigner);
    accountsJsonSubj.next(jsonAccounts.accounts);
  }
  return () => subscription.unsubscribe();
};
