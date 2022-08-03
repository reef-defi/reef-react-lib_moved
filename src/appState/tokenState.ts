import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  mergeScan,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import { BigNumber, FixedNumber, utils } from 'ethers';
import { gql } from '@apollo/client';
import { filter } from 'rxjs/operators';
import {combineTokensDistinct, _NFT_IPFS_RESOLVER_FN, toTokensWithPrice} from './util';
import { selectedSigner$ } from './accountState';
import { currentProvider$, currentNetwork$ } from './providerState';
import { apolloClientInstance$, zenToRx } from '../graphql/apollo';
import { getExtrinsicUrl, getIconUrl } from '../utils';
import { getReefCoinBalance, loadPools } from '../rpc';
import { retrieveReefCoingeckoPrice } from '../api';
import {
  ContractType,
  reefTokenWithAmount, Token, TokenNFT, TokenTransfer, TokenWithAmount,
} from '../state/token';
import { Network, Pool, ReefSigner } from '../state';
import { resolveNftImageLinks } from '../utils/nftUtil';

// TODO replace with our own from lib and remove
const toPlainString = (num: number): string => `${+num}`.replace(
  /(-?)(\d*)\.?(\d*)e([+-]\d+)/,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (a, b, c, d, e) => (e < 0
    ? `${b}0.${Array(1 - e - c.length).join('0')}${c}${d}`
    : b + c + d + Array(e - d.length + 1).join('0')),
);

const validatedTokens = { tokens: [] };

export const reefPrice$: Observable<number> = timer(0, 60000).pipe(
  switchMap(retrieveReefCoingeckoPrice),
  shareReplay(1),
);

export const validatedTokens$ = of(validatedTokens.tokens as Token[]);

const SIGNER_TOKENS_GQL = gql`
  subscription tokens_query($accountId: String!) {
    token_holder(
      order_by: { balance: desc }
      where: {
        _and: [
          { nft_id: { _is_null: true } }
          { token_address: { _is_null: false } }
          { signer: { _eq: $accountId } }
        ]
      }
    ) {
      token_address
      balance
    }
  }
`;

const SIGNER_NFTS_GQL = gql`
  subscription query($accountId: String) {
    token_holder(
      order_by: { balance: desc }
      where: {
        _and: [{ nft_id: { _is_null: false } }, { signer: { _eq: $accountId } }]
      }
    ) {
      nft_id
      balance
      info
      type
      evm_address
      token_address
      signer
      contract{
        verified_contract{
          name
          type
          contract_data
        }
      }
    }
  }
`;

const CONTRACT_DATA_GQL = gql`
  query contract_data_query($addresses: [String!]!) {
    verified_contract(where: { address: { _in: $addresses } }) {
      address
      contract_data
    }
  }
`;

// eslint-disable-next-line camelcase
const fetchTokensData = (
  // apollo: ApolloClient<any>,
  apollo: any,
  missingCacheContractDataAddresses: string[],
  state: { tokens: Token[]; contractData: Token[] },
): Promise<Token[]> => apollo
  .query({
    query: CONTRACT_DATA_GQL,
    variables: { addresses: missingCacheContractDataAddresses },
  })
// eslint-disable-next-line camelcase
  .then((verContracts) => verContracts.data.verified_contract.map(
    // eslint-disable-next-line camelcase
    (vContract: { address: string; contract_data: any }) => ({
      address: vContract.address,
      iconUrl: vContract.contract_data.token_icon_url,
      decimals: vContract.contract_data.decimals,
      name: vContract.contract_data.name,
      symbol: vContract.contract_data.symbol,
    } as Token),
  ))
  .then((newTokens) => newTokens.concat(state.contractData));

// eslint-disable-next-line camelcase
// const tokenBalancesWithContractDataCache = (apollo: ApolloClient<any>) => (
const tokenBalancesWithContractDataCache = (apollo: any) => (
  state: { tokens: Token[]; contractData: Token[] },
  // eslint-disable-next-line camelcase
  tokenBalances: { token_address: string; balance: number }[],
) => {
  const missingCacheContractDataAddresses = tokenBalances
    .filter(
      (tb) => !state.contractData.some((cd) => cd.address === tb.token_address),
    )
    .map((tb) => tb.token_address);
  const contractDataPromise = missingCacheContractDataAddresses.length
    ? fetchTokensData(apollo, missingCacheContractDataAddresses, state)
    : Promise.resolve(state.contractData);

  return contractDataPromise.then((cData: Token[]) => {
    const tkns = tokenBalances
      .map((tBalance) => {
        const cDataTkn = cData.find(
          (cd) => cd.address === tBalance.token_address,
        ) as Token;
        return {
          ...cDataTkn,
          balance: BigNumber.from(toPlainString(tBalance.balance)),
        };
      })
      .filter((v) => !!v);
    return { tokens: tkns, contractData: cData };
  });
};

const sortReefTokenFirst = (tokens): Token[] => {
  const { address } = reefTokenWithAmount();
  const reefTokenIndex = tokens.findIndex((t: Token) => t.address === address);
  if (reefTokenIndex > 0) {
    return [tokens[reefTokenIndex], ...tokens.slice(0, reefTokenIndex), ...tokens.slice(reefTokenIndex + 1, tokens.length)];
  }
  return tokens;
};
export const selectedSignerTokenBalances$: Observable<Token[]|null> = combineLatest([
  apolloClientInstance$,
  selectedSigner$,
  currentProvider$,
]).pipe(
  switchMap(([apollo, signer, provider]) => (!signer
    ? []
    : zenToRx(
      apollo.subscribe({
        query: SIGNER_TOKENS_GQL,
        variables: { accountId: signer.address },
        fetchPolicy: 'network-only',
      }),
    ).pipe(
      map((res: any) => (res.data && res.data.token_holder
        ? res.data.token_holder
        : undefined)),
      // eslint-disable-next-line camelcase
      switchMap(
        async (
          // eslint-disable-next-line camelcase
          tokenBalances: { token_address: string; balance: number }[],
        ) => {
          const reefTkn = reefTokenWithAmount();
          const reefTokenResult = tokenBalances.find(
            (tb) => tb.token_address === reefTkn.address,
          );

          const reefBalance = await getReefCoinBalance(
            signer.address,
            provider,
          );
          if (!reefTokenResult) {
            tokenBalances.push({
              token_address: reefTkn.address,
              balance: parseInt(utils.formatUnits(reefBalance, 'wei'), 10),
            });
            return Promise.resolve(tokenBalances);
          }

          reefTokenResult.balance = FixedNumber.fromValue(reefBalance).toUnsafeFloat();
          return Promise.resolve(tokenBalances);
        },
      ),
      // eslint-disable-next-line camelcase
      mergeScan(tokenBalancesWithContractDataCache(apollo), {
        tokens: [],
        contractData: [reefTokenWithAmount()],
      }),
      map((val: { tokens: Token[] }) => val.tokens.map((t) => ({
        ...t,
        iconUrl: t.iconUrl || getIconUrl(t.address),
      }))),
      map(sortReefTokenFirst),
    ))),
  catchError((err => {
    console.log('selectedSignerTokenBalances$ ERROR=',err.message);
    return of(null);
  }))
);

export const selectedSignerAddressUpdate$ = selectedSigner$.pipe(
  filter((v) => !!v),
  distinctUntilChanged((s1, s2) => s1?.address === s2?.address),
);

const parseTokenHolderArray = (resArr: any[]): TokenNFT[] => resArr.map((res) => ({
  address: res.token_address,
  balance: res.balance,
  symbol: res.info.symbol,
  name: res.info.name,
  nftId: res.nft_id,
  contractType: res.contract.verified_contract.type,
  iconUrl: '',
} as TokenNFT));

export const selectedSignerNFTs$: Observable<TokenNFT[]> = combineLatest([
  apolloClientInstance$,
  selectedSignerAddressUpdate$,
  currentProvider$,
])
  .pipe(
    switchMap(([apollo, signer]) => (!signer
      ? []
      : zenToRx(
        apollo.subscribe({
          query: SIGNER_NFTS_GQL,
          variables: {
            accountId: signer.address,
          },
          fetchPolicy: 'network-only',
        }),
      )
        .pipe(
          map((res: any) => (res.data && res.data.token_holder
            ? res.data.token_holder
            : undefined)),
          map(parseTokenHolderArray),
          switchMap((nfts: TokenNFT[]) => (resolveNftImageLinks(nfts, signer.signer, _NFT_IPFS_RESOLVER_FN) as Observable<TokenNFT[]>)),
        ))),
  );

export const allAvailableSignerTokens$: Observable<Token[]> = combineLatest([
  selectedSignerTokenBalances$,
  validatedTokens$,
]).pipe(map(combineTokensDistinct), shareReplay(1));

// TODO when network changes signer changes as well? this could make 2 requests unnecessary - check
export const pools$: Observable<Pool[]> = combineLatest([
  allAvailableSignerTokens$,
  currentNetwork$,
  selectedSigner$,
]).pipe(
  switchMap(([tkns, network, signer]) => (signer ? loadPools(tkns, signer.signer, network.factoryAddress) : [])),
  shareReplay(1),
);

// TODO pools and tokens emit events at same time - check how to make 1 event from it
export const tokenPrices$: Observable<TokenWithAmount[]> = combineLatest([
  allAvailableSignerTokens$,
  reefPrice$,
  pools$,
]).pipe(map(toTokensWithPrice), shareReplay(1));

const TRANSFER_HISTORY_GQL = gql`
  subscription query($accountId: String!) {
    transfer(
      where: {
        _or: [
          { to_address: { _eq: $accountId } }
          { from_address: { _eq: $accountId } }
        ]
        _and: { success: { _eq: true } }
      }
      limit: 10
      order_by: { timestamp: desc }
    ) {
      amount
      success
      token_address
      from_address
      to_address
      timestamp
      nft_id
      token {
        address
        verified_contract {
          name
          type
          contract_data
        }
      }
      extrinsic{
        block_id
        index
        hash
      }
    }
  }
`;

const resolveTransferHistoryNfts = (tokens: (Token | TokenNFT)[], signer: ReefSigner): Observable<(Token | TokenNFT)[]> => {
  const nftOrNull: (TokenNFT|null)[] = tokens.map((tr) => ('contractType' in tr && (tr.contractType === ContractType.ERC1155 || tr.contractType === ContractType.ERC721) ? tr : null));
  if (!nftOrNull.filter((v) => !!v).length) {
    return of(tokens);
  }
  return of(nftOrNull)
    .pipe(
      switchMap((nfts) => resolveNftImageLinks(nfts, signer.signer, _NFT_IPFS_RESOLVER_FN)),
      map((nftOrNullResolved: (TokenNFT | null)[]) => {
        const resolvedNftTransfers: (Token | TokenNFT)[] = [];
        nftOrNullResolved.forEach((nftOrN, i) => {
          resolvedNftTransfers.push(nftOrN || tokens[i]);
        });
        return resolvedNftTransfers;
      }),
    );
};

const toTransferToken = (transfer): Token|TokenNFT => (transfer.token.verified_contract.type === ContractType.ERC20 ? {
  address: transfer.token_address,
  balance: BigNumber.from(toPlainString(transfer.amount)),
  name: transfer.token.verified_contract.contract_data.name,
  symbol: transfer.token.verified_contract.contract_data.symbol,
  decimals:
      transfer.token.verified_contract.contract_data.decimals,
  iconUrl:
        transfer.token.verified_contract.contract_data.icon_url
        || getIconUrl(transfer.token_address),
} as Token
  : {
    address: transfer.token_address,
    balance: BigNumber.from(toPlainString(transfer.amount)),
    name: transfer.token.verified_contract.contract_data.name,
    symbol: transfer.token.verified_contract.contract_data.symbol,
    decimals: 0,
    iconUrl: '',
    nftId: transfer.nft_id,
    contractType: transfer.token.verified_contract.type,
  } as TokenNFT);

const toTokenTransfers = (resTransferData: any[], signer, network: Network): TokenTransfer[] => resTransferData.map((transferData): TokenTransfer => ({
  from: transferData.from_address,
  to: transferData.to_address,
  inbound:
    transferData.to_address === signer.evmAddress
    || transferData.to_address === signer.address,
  timestamp: transferData.timestamp,
  token: toTransferToken(transferData),
  url: getExtrinsicUrl(transferData.extrinsic.hash, network),
  extrinsic: { blockId: transferData.extrinsic.block_id, hash: transferData.extrinsic.hash, index: transferData.extrinsic.index },
}));

export const transferHistory$: Observable<
  | null
  | TokenTransfer[]
> = combineLatest([apolloClientInstance$, selectedSigner$, currentNetwork$]).pipe(
  switchMap(([apollo, signer, network]) => (!signer
    ? []
    : zenToRx(
      apollo.subscribe({
        query: TRANSFER_HISTORY_GQL,
        variables: { accountId: signer.address },
        fetchPolicy: 'network-only',
      }),
    )
      .pipe(
        map((res: any) => (res.data && res.data.transfer ? res.data.transfer : undefined)),
        map((resData: any) => toTokenTransfers(resData, signer, network)),
        switchMap((transfers: TokenTransfer[]) => {
          const tokens = transfers.map((tr: TokenTransfer) => tr.token);
          return resolveTransferHistoryNfts(tokens, signer)
            .pipe(
              map((resolvedTokens: (Token | TokenNFT)[]) => resolvedTokens.map((resToken: Token | TokenNFT, i) => ({
                ...transfers[i],
                token: resToken,
              }))),
            );
        }),
      ))),
  startWith(null),
  shareReplay(1),
);
