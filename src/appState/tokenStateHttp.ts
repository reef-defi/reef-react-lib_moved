import {
  combineLatest, map, mergeScan, Observable, shareReplay, startWith, Subject, switchMap,
} from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  api, Network, Pool, ReefSigner, reefTokenWithAmount, rpc, Token,
} from '@reef-defi/react-lib';
import { BigNumber } from 'ethers';
import { combineTokensDistinct, toTokensWithPrice } from './util';
import { getAddressUpdateActionTypes, UpdateDataCtx, UpdateDataType } from './updateCtxUtil';
import { selectedSignerHttp$, selectedSignerUpdateCtxHttp$ } from './accountStateHttp';
import { selectedNetworkSubj } from './providerState';
import { reefPrice$, validatedTokens$ } from './tokenState';

export const reloadSignerTokens$ = new Subject<void>();

function updateReefBalance(tokens: Token[], balance: BigNumber): Promise<Token[]> {
  const reefTkn = tokens.find((t) => t.address === reefTokenWithAmount().address);
  if (reefTkn) {
    reefTkn.balance = balance;
  }
  return Promise.resolve([...tokens]);
}

export const selectedSignerTokenBalancesHTTP$ = combineLatest([selectedSignerUpdateCtxHttp$, selectedNetworkSubj, reloadSignerTokens$.pipe(startWith(null))]).pipe(
  mergeScan((state: { tokens: Token[], stopEmit?: boolean }, [signerCtx, network, _]: [UpdateDataCtx<ReefSigner>, Network, any]) => {
    if (!signerCtx.data) {
      return Promise.resolve({ tokens: [], stopEmit: false });
    }
    const isTokenUpdate = getAddressUpdateActionTypes(signerCtx.data.address, signerCtx.updateActions).indexOf(UpdateDataType.ACCOUNT_TOKENS) >= 0;
    if (isTokenUpdate) {
      return api.loadSignerTokens(signerCtx.data, network).then((tokens) => ({ tokens, stopEmit: false }));
    }
    const isReefUpdate = getAddressUpdateActionTypes(signerCtx.data.address, signerCtx.updateActions).indexOf(UpdateDataType.ACCOUNT_NATIVE_BALANCE) >= 0;
    if (isReefUpdate) {
      return updateReefBalance(state.tokens, signerCtx.data.balance).then((tokens) => ({ tokens, stopEmit: false }));
    }
    return Promise.resolve({ tokens: state.tokens, stopEmit: true });
  }, { tokens: [], stopEmit: false }),
  filter((v: { tokens: Token[], stopEmit?: boolean }) => !v.stopEmit),
  map((state) => state.tokens),
  shareReplay(1),
) as Observable<Token[]>;

export const allAvailableSignerTokensHttp$ = combineLatest([selectedSignerTokenBalancesHTTP$, validatedTokens$]).pipe(
  map(combineTokensDistinct),
  shareReplay(1),
);

// TODO when network changes signer changes as well? this could make 2 requests unnecessary - check
export const poolsHttp$: Observable<Pool[]> = combineLatest([allAvailableSignerTokensHttp$, selectedNetworkSubj, selectedSignerHttp$]).pipe(
  switchMap(([tkns, network, signer]) => {
    console.log('LOADpools =', signer, tkns);
    return signer ? rpc.loadPools(tkns, signer.signer, network.factoryAddress) : [];
  }),
  shareReplay(1),
);

// TODO pools and tokens emit events at same time - check how to make 1 event from it
export const tokenPricesHttp$ = combineLatest([allAvailableSignerTokensHttp$, reefPrice$, poolsHttp$]).pipe(
  map(toTokensWithPrice),
  shareReplay(1),
);
