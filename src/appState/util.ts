import { ContractInterface } from 'ethers';
import { Subject } from 'rxjs';
import { ContractType, Token, TokenWithAmount } from '../state/token';
import { UpdateAction, UpdateDataCtx } from './updateStateModel';
import { calculateTokenPrice, TxStatusUpdate } from '../utils';
import { ERC20 } from '../assets/abi/ERC20';
import { ERC721Uri } from '../assets/abi/ERC721Uri';
import { ERC1155Uri } from '../assets/abi/ERC1155Uri';
import { ipfsUrlResolverFn } from '../utils/nftUtil';
import { PoolReserves } from '../graphql/pools';
import { ReefSigner } from '../state';

export const reloadSignersSubj = new Subject<UpdateDataCtx<ReefSigner[]>>();

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
