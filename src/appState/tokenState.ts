import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  mergeScan,
  Observable,
  of,
  shareReplay, startWith,
  switchMap,
  timer,
} from 'rxjs';
import { BigNumber, FixedNumber, utils } from 'ethers';
import { filter } from 'rxjs/operators';
import { graphql } from '@reef-chain/util-lib';
import { ApolloClient } from '@apollo/client';
import { _NFT_IPFS_RESOLVER_FN, combineTokensDistinct, toTokensWithPrice } from './util';
import { selectedSigner$ } from './accountState';
import { currentNetwork$, currentProvider$ } from './providerState';
import { apolloExplorerClientInstance$, zenToRx } from '../graphql/apollo';
import { getIconUrl, getTransferUrl } from '../utils';
import { getReefCoinBalance } from '../rpc';
import { retrieveReefCoingeckoPrice } from '../api';
import {
  ContractType, reefTokenWithAmount, Token, TokenTransfer, TokenWithAmount,
} from '../state/token';
import { Network, NFT, ReefSigner } from '../state';
import { resolveNftImageLinks } from '../utils/nftUtil';
import { apolloDexClientInstance$ } from '../graphql';
import { PoolReserves, POOLS_RESERVES_GQL, PoolsWithReservesQuery } from '../graphql/pools';

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
export const { SIGNER_TOKENS_GQL } = graphql;

const { CONTRACT_DATA_GQL } = graphql;

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
  .then((verContracts) => verContracts.data.verifiedContracts.map(
    // eslint-disable-next-line camelcase
    (vContract: { id: string; contractData: any }) => ({
      address: vContract.id,
      iconUrl: vContract.contractData.tokenIconUrl,
      decimals: vContract.contractData.decimals,
      name: vContract.contractData.name,
      symbol: vContract.contractData.symbol,
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
  apolloExplorerClientInstance$,
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
      map((res: any) => (res.data && res.data.tokenHolders
        ? res.data.tokenHolders.map((th) => ({ token_address: th.token.id, balance: th.balance }))
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
  catchError(((err) => {
    console.log('selectedSignerTokenBalances$ ERROR=', err.message);
    return of(null);
  })),
);

export const selectedSignerAddressUpdate$ = selectedSigner$.pipe(
  filter((v) => !!v),
  distinctUntilChanged((s1, s2) => s1?.address === s2?.address),
);

export const allAvailableSignerTokens$: Observable<Token[]> = combineLatest([
  selectedSignerTokenBalances$,
  validatedTokens$,
]).pipe(map(combineTokensDistinct), shareReplay(1));

export const pools$: Observable<PoolReserves[]> = combineLatest([
  allAvailableSignerTokens$,
  apolloDexClientInstance$,
]).pipe(
  switchMap(([tkns, dexClient]) => loadPoolsReserves(tkns, dexClient)),
  shareReplay(1),
);

const loadPoolsReserves = async (
  tokens: Token[],
  dexClient: ApolloClient<any>,
): Promise<PoolReserves[]> => {
  if (tokens.length < 2) return [];

  const tokenAddresses = tokens.map((t) => t.address);
  const res = await dexClient.query<PoolsWithReservesQuery>(
    { query: POOLS_RESERVES_GQL, variables: { tokens: tokenAddresses } },
  );
  return res.data.poolsReserves || [];
};

export const tokenPrices$: Observable<TokenWithAmount[]> = combineLatest([
  allAvailableSignerTokens$,
  reefPrice$,
  pools$,
]).pipe(
  map(toTokensWithPrice),
  shareReplay(1),
);

const resolveTransferHistoryNfts = (tokens: (Token | NFT)[], signer: ReefSigner): Observable<(Token | NFT)[]> => {
  const nftOrNull: (NFT|null)[] = tokens.map((tr) => ('contractType' in tr && (tr.contractType === ContractType.ERC1155 || tr.contractType === ContractType.ERC721) ? tr : null));
  if (!nftOrNull.filter((v) => !!v).length) {
    return of(tokens);
  }
  return of(nftOrNull)
    .pipe(
      switchMap((nfts) => resolveNftImageLinks(nfts, signer.signer, _NFT_IPFS_RESOLVER_FN)),
      map((nftOrNullResolved: (NFT | null)[]) => {
        const resolvedNftTransfers: (Token | NFT)[] = [];
        nftOrNullResolved.forEach((nftOrN, i) => {
          resolvedNftTransfers.push(nftOrN || tokens[i]);
        });
        return resolvedNftTransfers;
      }),
    );
};

const toTransferToken = (transfer): Token|NFT => (transfer.token.type === ContractType.ERC20 ? {
  address: transfer.id,
  balance: BigNumber.from(toPlainString(transfer.amount)),
  name: transfer.token.contractData.name,
  symbol: transfer.token.contractData.symbol,
  decimals:
      transfer.token.contractData.decimals,
  iconUrl:
        transfer.token.contractData.iconUrl
        || getIconUrl(transfer.token.id),
} as Token
  : {
    address: transfer.token.id,
    balance: BigNumber.from(toPlainString(transfer.amount)),
    name: transfer.token.contractData.name,
    symbol: transfer.token.contractData.symbol,
    decimals: 0,
    iconUrl: '',
    nftId: transfer.nftId,
    contractType: transfer.token.type,
  } as NFT);

const toTokenTransfers = (resTransferData: any[], signer, network: Network): TokenTransfer[] => resTransferData.map((transferData): TokenTransfer => ({
  from: transferData.from.evmAddress || transferData.from.id,
  to: transferData.to.evmAddress || transferData.to.id,
  inbound:
    transferData.to.evmAddress === signer.evmAddress
    || transferData.to.id === signer.address,
  timestamp: transferData.timestamp,
  token: toTransferToken(transferData),
  url: getTransferUrl(transferData.extrinsic, network),
  extrinsic: { blockId: transferData.extrinsic.block_id, hash: transferData.extrinsic.hash, index: transferData.extrinsic.index },
}));

export const transferHistory$: Observable<
  | null
  | TokenTransfer[]
> = combineLatest([apolloExplorerClientInstance$, selectedSigner$, currentNetwork$]).pipe(
  switchMap(([apollo, signer, network]) => (!signer
    ? []
    : zenToRx(
      apollo.subscribe({
        query: graphql.TRANSFER_HISTORY_GQL,
        variables: { accountId: signer.address },
        fetchPolicy: 'network-only',
      }),
    )
      .pipe(
        map((res: any) => {
          const resHist = res.data && Array.isArray(res.data.transfers) ? res.data.transfers : [];
          return resHist;
        }),
        map((resData: any) => toTokenTransfers(resData, signer, network)),
        switchMap((transfers: TokenTransfer[]) => {
          const tokens = transfers.map((tr: TokenTransfer) => tr.token);
          return resolveTransferHistoryNfts(tokens, signer)
            .pipe(
              map((resolvedTokens: (Token | NFT)[]) => resolvedTokens.map((resToken: Token | NFT, i) => ({
                ...transfers[i],
                token: resToken,
              }))),
            );
        }),
      ))),
  startWith(null),
  shareReplay(1),
);
