import {
  combineLatest, from, map, mergeScan, Observable, of, shareReplay, startWith, switchMap, timer,
} from 'rxjs';
import { BigNumber, utils } from 'ethers';
import { ApolloClient, gql } from '@apollo/client';
import { combineTokensDistinct, toTokensWithPrice } from './util';
import { selectedSigner$ } from './accountState';
import { providerSubj, selectedNetworkSubj } from './providerState';
import { apolloClientInstance$ } from '../graphql/apollo';
import { getIconUrl } from '../utils';
import { getReefCoinBalance, loadPools } from '../rpc';
import { retrieveReefCoingeckoPrice } from '../api';
import { reefTokenWithAmount, Token, TokenWithAmount } from '../state/token';
import { Pool } from '../state';

// TODO replace with our own from lib and remove
const toPlainString = (num: number): string => (`${+num}`).replace(/(-?)(\d*)\.?(\d*)e([+-]\d+)/,
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  (a, b, c, d, e) => (e < 0
    ? `${b}0.${Array(1 - e - c.length).join('0')}${c}${d}`
    : b + c + d + Array(e - d.length + 1).join('0')));

const validatedTokens = { tokens: [] };

export const reefPrice$: Observable<number> = timer(0, 60000).pipe(
  switchMap(retrieveReefCoingeckoPrice),
  shareReplay(1),
);

export const validatedTokens$ = of(validatedTokens.tokens as Token[]);

const SIGNER_TOKENS_GQL = gql`
  subscription query ($accountId: String!) {
            token_holder(
              order_by: { balance: desc }
              where: { signer: { _eq: $accountId } }
            ) {
              token_address
              balance
            }
          }
`;
const CONTRACT_DATA_GQL = gql`
  query query ($addresses: [String!]!) {
            verified_contract(
              where: { address: { _in: $addresses } }
            ) {
              address
              contract_data
            }
          }
`;

// eslint-disable-next-line camelcase
const fetchTokensData = (apollo: ApolloClient<any>, missingCacheContractDataAddresses: string[], state: { tokens: Token[]; contractData: Token[] }): Promise<Token[]> => apollo.query({
  query: CONTRACT_DATA_GQL,
  variables: { addresses: missingCacheContractDataAddresses },
})
// eslint-disable-next-line camelcase
  .then((verContracts) => verContracts.data.verified_contract.map((vContract: { address: string, contract_data: any }) => ({
    address: vContract.address,
    iconUrl: vContract.contract_data.token_icon_url,
    decimals: vContract.contract_data.decimals,
    name: vContract.contract_data.name,
    symbol: vContract.contract_data.symbol,
  } as Token)))
  .then((newTokens) => newTokens.concat(state.contractData));

// eslint-disable-next-line camelcase
const tokenBalancesWithContractDataCache = (apollo: ApolloClient<any>) => (state: { tokens: Token[], contractData: Token[] }, tokenBalances: { token_address: string, balance: number}[]) => {
  const missingCacheContractDataAddresses = tokenBalances.filter((tb) => !state.contractData.some((cd) => cd.address === tb.token_address)).map((tb) => tb.token_address);
  const contractDataPromise = missingCacheContractDataAddresses.length
    ? fetchTokensData(apollo, missingCacheContractDataAddresses, state)
    : Promise.resolve(state.contractData);

  return contractDataPromise.then((cData: Token[]) => {
    const tkns = tokenBalances.map((tBalance) => {
      const cDataTkn = cData.find((cd) => cd.address === tBalance.token_address) as Token;
      return { ...cDataTkn, balance: BigNumber.from(toPlainString(tBalance.balance)) };
    }).filter((v) => !!v);
    return { tokens: tkns, contractData: cData };
  });
};

export const selectedSignerTokenBalancesWS$: Observable<Token[]> = combineLatest([apolloClientInstance$, selectedSigner$, providerSubj]).pipe(
  switchMap(([apollo, signer, provider]) => (!signer ? []
    : from(apollo.subscribe({
      query: SIGNER_TOKENS_GQL,
      variables: { accountId: signer.address },
      fetchPolicy: 'network-only',
    })).pipe(
      map((res: any) => (res.data && res.data.token_holder ? res.data.token_holder : undefined)),
      // eslint-disable-next-line camelcase
      switchMap((tokenBalances:{token_address: string, balance: number}[]) => {
        const reefTkn = reefTokenWithAmount();
        const hasReefBalance = tokenBalances.some((tb) => tb.token_address === reefTkn.address);
        if (!hasReefBalance) {
          return getReefCoinBalance(signer.address, provider).then((reefBalance: any) => {
            tokenBalances.push({ token_address: reefTkn.address, balance: parseInt(utils.formatUnits(reefBalance, 'wei'), 10) });
            return tokenBalances;
          });
        }
        return Promise.resolve(tokenBalances);
      }),
      // eslint-disable-next-line camelcase
      mergeScan(tokenBalancesWithContractDataCache(apollo), { tokens: [], contractData: [reefTokenWithAmount()] }),
      map((val: {tokens: Token[]}) => val.tokens.map((t) => ({ ...t, iconUrl: t.iconUrl || getIconUrl(t.address) }))),
    )
  )),
);

export const allAvailableSignerTokens$: Observable<Token[]> = combineLatest([selectedSignerTokenBalancesWS$, validatedTokens$]).pipe(
  map(combineTokensDistinct),
  shareReplay(1),
);

// TODO when network changes signer changes as well? this could make 2 requests unnecessary - check
export const pools$: Observable<Pool[]> = combineLatest([allAvailableSignerTokens$, selectedNetworkSubj, selectedSigner$]).pipe(
  switchMap(([tkns, network, signer]) => {
    console.log('LOAD pools=', signer, tkns);
    return signer ? loadPools(tkns, signer.signer, network.factoryAddress) : [];
  }),
  shareReplay(1),
);

// TODO pools and tokens emit events at same time - check how to make 1 event from it
export const tokenPrices$: Observable<TokenWithAmount[]> = combineLatest([allAvailableSignerTokens$, reefPrice$, pools$]).pipe(
  map(toTokensWithPrice),
  shareReplay(1),
);

const TRANSFER_HISTORY_GQL = gql`
subscription query($accountId: String!){
    transfer(
        where: {_or: [
                  { to_address: { _eq: $accountId } }
                  { from_address: { _eq: $accountId } }
                ]
                _and: { success: { _eq: true }}
                },
        limit: 10,
        order_by: {timestamp: desc}
    ) {
    amount
    success
    token_address
    from_address
    to_address
    timestamp
    token {
        address
        verified_contract {
          contract_data
        }
      }
  }
}`;
export const transferHistory$: Observable<null|{ from: string, to: string, token: Token, timestamp: number, inbound: boolean; }[]> = combineLatest([apolloClientInstance$, selectedSigner$]).pipe(
  switchMap(([apollo, signer]) => (!signer ? []
    : from(apollo.subscribe({
      query: TRANSFER_HISTORY_GQL,
      variables: { accountId: signer.address },
      fetchPolicy: 'network-only',
    })).pipe(
      map((res: any) => (res.data && res.data.transfer ? res.data.transfer : undefined)),
      map((res: any[]) => (res.map((transfer) => ({
        from: transfer.from_address,
        to: transfer.to_address,
        inbound: transfer.to_address === signer.evmAddress || transfer.to_address === signer.address,
        timestamp: transfer.timestamp,
        token: {
          address: transfer.token_address,
          balance: BigNumber.from(toPlainString(transfer.amount)),
          name: transfer.token.verified_contract.contract_data.name,
          symbol: transfer.token.verified_contract.contract_data.symbol,
          decimals: transfer.token.verified_contract.contract_data.decimals,
          iconUrl: transfer.token.verified_contract.contract_data.icon_url || getIconUrl(transfer.token_address),
        },
      })))),
    ))),
  startWith(null),
  shareReplay(1),
);

transferHistory$.subscribe((val): any => {
  console.log('HISTTT2=', val);
});

/* TODO evmEvents observable
const getGqlContractEventsQuery = (contractAddress: string, methodSignature?: string, perPage = 10, offset = 0): SubscriptionOptions => {
  const EVM_EVENT_GQL = gql`
    subscription evmEvent($address: String!, $perPage: Int!, $offset: Int!, $topic0: String){
        evm_event(
        limit: $perPage,
        offset: $offset
        order_by: {block_id: desc, extrinsic_index: desc, event_index: desc},
        where: {
            contract_address: {_eq: $address},
            topic_0: {_eq:$topic0},
            method: {_eq: "Log"}
            }
        ) {
        contract_address
        data_parsed
        data_raw
        topic_0
        topic_1
        topic_2
        topic_3
      }
    }`;
  return {
    query: EVM_EVENT_GQL,
    variables: {
      address: contractAddress,
      topic0: methodSignature ? utils.keccak256(utils.toUtf8Bytes(methodSignature)) : undefined,
      perPage,
      offset,
    },
    fetchPolicy: 'network-only',
  };
};

export const evmEvents$: Observable<any[]> = combineLatest([apolloClientInstance$, selectedSigner$, providerSubj]).pipe(
  switchMap(([apollo, signer]) => (!signer ? []
    : from(apollo.subscribe(getGqlContractEventsQuery('0x0230135fDeD668a3F7894966b14F42E65Da322e4'))).pipe(
      map((res: any) => (res.data && res.data.evm_event ? res.data.evm_event : undefined)),
    )
  )),
); */
