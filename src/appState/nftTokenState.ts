import {
  combineLatest, from, map, Observable, switchMap,
} from 'rxjs';
import { BigNumber } from 'ethers';
import { NFT } from '../state';
import { currentProvider$ } from './providerState';
import { selectedSignerAddressUpdate$ } from './tokenState';
import { resolveNftImageLinks } from '../utils/nftUtil';
import { _NFT_IPFS_RESOLVER_FN } from './util';
import axios, { AxiosInstance } from 'axios';
import { graphqlRequest } from './accountState';

const SIGNER_NFTS_GQL = `
query query($accountId: String) {
  tokenHolders(
  orderBy: balance_DESC
  limit:199
  where: {AND: {nftId_isNull: false, token: {id_isNull: false}, signer: {id_eq: $accountId}, balance_gt: "0"}, type_eq: Account}
) {
  token {
    id
    type
  }
  balance
  nftId
}
}`;


const getSignerNfts = (accountId: string) => {
  return {
    query: SIGNER_NFTS_GQL,
    variables: {
      accountId
    },
  };
};

export interface VerifiedNft {
  token_address: string;
  balance: string;
  nft_id: string;
  info: { symbol: string };
  contractType: 'ERC1155' | 'ERC721';
}

const parseTokenHolderArray = (resArr: VerifiedNft[]): NFT[] => resArr.map(({
  balance,
  nft_id: nftId,
  info: { symbol },
  token_address,
  contractType,
}) => ({
  contractType,
  balance: BigNumber.from(balance),
  nftId,
  symbol,
  decimals: 0,
  address: token_address,
  iconUrl: '',
} as NFT));

const queryGql$ = (
  client: AxiosInstance,
  queryObj: { query: string; variables: any }
) =>
  from(graphqlRequest(client as AxiosInstance, queryObj,true).then(res => res.data));

export const selectedSignerNFTs$: Observable<NFT[]> = combineLatest([
  selectedSignerAddressUpdate$,
  currentProvider$,
])
  .pipe(
    switchMap(([ signer]) => (!signer
      ? []
      :queryGql$(axios,getSignerNfts(signer.address))
        .pipe(
          map(({ data }) => {
            const verNfts = data && Array.isArray(data.tokenHolders)
              ? data.tokenHolders.map((th: any) => ({
                balance: th.balance,
                nft_id: th.nftId,
                info: { symbol: '' },
                token_address: th.token?.id,
                contractType: th.token?.type,
              } as VerifiedNft))
              : null;
            return verNfts;
          }),
          map((res: VerifiedNft[] | undefined) => parseTokenHolderArray(res || [])),
          switchMap((nfts: NFT[]) => (resolveNftImageLinks(nfts, signer.signer, _NFT_IPFS_RESOLVER_FN) as Observable<NFT[]>)),
        ))),
  );