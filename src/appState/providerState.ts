import { Observable, ReplaySubject, shareReplay } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import {
  reefState,
} from '@reef-chain/util-lib';
import { Network } from '../state';

export const providerSubj: ReplaySubject<Provider> = new ReplaySubject<Provider>(1);

export const ACTIVE_NETWORK_LS_KEY = 'reef-app-active-network';
export const currentProvider$ = providerSubj.asObservable().pipe(shareReplay(1));
export const setCurrentProvider = (provider: Provider): void => providerSubj.next(provider);
export const currentNetwork$ = reefState.selectedNetwork$ as Observable<Network>;
export const setCurrentNetwork = reefState.setSelectedNetwork;