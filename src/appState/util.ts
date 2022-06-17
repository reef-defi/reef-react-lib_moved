import { ContractInterface } from 'ethers';
import { ContractType, Token, TokenWithAmount } from '../state/token';
import { accountsSubj, reloadSignersSubj } from './accountState';
import { UpdateAction } from './updateStateModel';
import { availableNetworks, Network, Pool, ReefSigner } from '../state';
import { calculateTokenPrice, disconnectProvider, TxStatusUpdate } from '../utils';
import { ERC20 } from '../assets/abi/ERC20';
import { ERC721Uri } from '../assets/abi/ERC721Uri';
import { ERC1155Uri } from '../assets/abi/ERC1155Uri';
import { Provider } from '@reef-defi/evm-provider';
import { ApolloClient } from '@apollo/client';
import { initProvider } from '../utils/providerUtil';
import { currentNetwork$, setCurrentNetwork, setCurrentProvider } from './providerState';
import { defer, finalize, Observable, scan, switchMap, tap } from 'rxjs';
import { apolloClientSubj, setApolloUrls } from '../graphql';

export const combineTokensDistinct = ([tokens1, tokens2]: [
  Token[],
  Token[]
]): Token[] => {
  const combinedT = [...tokens1];
  tokens2.forEach((vT: Token) => (!combinedT.some((cT) => cT.address === vT.address)
    ? combinedT.push(vT)
    : null));
  return combinedT;
};

export const toTokensWithPrice = ([tokens, reefPrice, pools]: [
  Token[],
  number,
  Pool[]
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


export const getGQLUrls = (network: Network): { ws: string; http: string }|undefined => {
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
  client?: ApolloClient<any>;
}

export function initApolloClient(selectedNetwork?: Network, client?: ApolloClient<any> ) {
  if (selectedNetwork) {
    if (!client) {
      const gqlUrls = getGQLUrls(selectedNetwork);
      if (gqlUrls) {
        setApolloUrls(gqlUrls);
      }
    } else {
      apolloClientSubj.next(client);
    }
  }
}

type destroyConnection = ()=>void;
export const initReefState = (//applicationDisplayName: string,
  {
    network,
    client,
    signers,
  }: StateOptions,): destroyConnection => {
  const subscription = currentNetwork$.pipe(
    switchMap((network) => initProvider(network.rpcUrl)
      .then(provider => ({
        provider,
        network
      }))),
    scan((state: { provider: Provider }, newVal: { provider: Provider, network }) => {
      if (state.provider) {
        disconnectProvider(state.provider);
      }
      return { provider: newVal.provider, network: newVal.network };
    }, {}),
    tap((p_n: { provider: Provider, network: Network }) => {
        setCurrentProvider(p_n.provider)}),
    tap((p_n) => {
      initApolloClient(p_n.network, client);
    }),
    finalizeWithValue((p_n => disconnectProvider(p_n.provider))),
  )
    .subscribe({
      error: (e) => {
        console.log('initReefState ERR=', e.message);
      }
    });
  setCurrentNetwork(network||availableNetworks.mainnet);
  accountsSubj.next(signers || null);
  return () => subscription.unsubscribe();
}

function finalizeWithValue<T>(callback: (value: T) => void) {
  return (source: Observable<T>) => defer(() => {
    let lastValue: T;
    return source.pipe(
      tap(value => lastValue = value),
      finalize(() => callback(lastValue)),
    )
  })
}
