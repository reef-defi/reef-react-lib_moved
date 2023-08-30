import { ContractInterface } from 'ethers';
import { Provider } from '@reef-defi/evm-provider';
import type { Signer as InjectedSigningKey } from '@polkadot/api/types';
import { AccountJson } from '@reef-defi/extension-base/background/types';
import type { InjectedAccountWithMeta as InjectedAccountWithMetaReef } from '@reef-defi/extension-inject/types';
import type {
  InjectedAccountWithMeta,
} from '@polkadot/extension-inject/types';
import { ContractType, Token, TokenWithAmount } from '../state/token';
import {reloadSignersSubj,
} from './accountState';
import { UpdateAction } from './updateStateModel';
import {
 Network, ReefSigner,
} from '../state';
import { calculateTokenPrice, TxStatusUpdate } from '../utils';
import { ERC20 } from '../assets/abi/ERC20';
import { ERC721Uri } from '../assets/abi/ERC721Uri';
import { ERC1155Uri } from '../assets/abi/ERC1155Uri';
import {
  axiosDexClientSubj, axiosExplorerClientSubj, GQLUrl, setAxiosDexUrls, setAxiosExplorerUrls,
} from '../graphql';
import { ipfsUrlResolverFn } from '../utils/nftUtil';
import { PoolReserves } from '../graphql/pools';
import { AxiosInstance } from 'axios';

type GQLUrlType = 'explorer' | 'dex';

export let _NFT_IPFS_RESOLVER_FN: ipfsUrlResolverFn|undefined;

export const setNftIpfsResolverFn = (val?: ipfsUrlResolverFn) => {
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
  explorerClient?: AxiosInstance;
  dexClient?: AxiosInstance;
  jsonAccounts?:{accounts: AccountJson[] | InjectedAccountWithMeta[] | InjectedAccountWithMetaReef[], injectedSigner: InjectedSigningKey}
  ipfsHashResolverFn?: ipfsUrlResolverFn;
}

export function initAxiosClients(selectedNetwork?: Network, explorerClient?: AxiosInstance, dexClient?: AxiosInstance) {
  if (selectedNetwork) {
    if (!explorerClient && !dexClient) {
      const gqlUrls = getGQLUrls(selectedNetwork);
      console.log(gqlUrls.get('explorer')!);
      if (gqlUrls) {
        if (gqlUrls.get('explorer')) {
          setAxiosExplorerUrls(gqlUrls.get('explorer')!);
        }
        if (gqlUrls.get('dex')) {
          setAxiosDexUrls(gqlUrls.get('dex')!);
        }
      }
    } else {
      if (explorerClient) {
        axiosExplorerClientSubj.next(explorerClient);
      }
      if (dexClient) {
        axiosDexClientSubj.next(dexClient);
      }
    }
  }
}