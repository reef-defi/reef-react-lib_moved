import { BigNumber, ContractInterface } from 'ethers';
import { ContractType, Token, TokenWithAmount } from '../state/token';
import { accountsSubj, reloadSignersSubj } from './accountState';
import { UpdateAction } from './updateStateModel';
import { availableNetworks, Network, Pool, ReefSigner } from '../state';
import { calculateTokenPrice, TxStatusUpdate } from '../utils';
import { ERC20 } from '../assets/abi/ERC20';
import { ERC721Uri } from '../assets/abi/ERC721Uri';
import { ERC1155Uri } from '../assets/abi/ERC1155Uri';
import { Provider, Signer } from '@reef-defi/evm-provider';
import { ApolloClient } from '@apollo/client';
import { disconnectProvider, initProvider } from '../utils/providerUtil';
import { currentNetwork$, setCurrentNetwork, setCurrentProvider } from './providerState';
import { switchMap, tap } from 'rxjs';
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
  network: Network;
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
export const initReefState = async(applicationDisplayName: string,
  {
    network = availableNetworks.mainnet,
    client,
    signers,
  }: StateOptions,) => {
  currentNetwork$.pipe(
    switchMap((network) => initProvider(network.rpcUrl)
      .then(provider => ({
        provider,
        network
      }))),
    tap((p_n) => setCurrentProvider(p_n.provider)),
    tap((p_n) => initApolloClient(p_n.network, client)),
    tap((p_n) => {
      accountsSubj.next(signers || [{
        name: 'test1',
        signer: null,
        balance: BigNumber.from('0'),
        address: '0xfb730ec3f38aB358AafA2EdD3fB2C17a5337dD7C',
        evmAddress: '',
        isEvmClaimed: false,
        source: 'mobileApp',
        genesisHash: null
      } as ReefSigner]);
    })

//TODO disconnect provider!!!
  ).subscribe(null, (err)=>disconnectProvider(), ()=>{disconnectProvider()});
  setCurrentNetwork(network);
}
