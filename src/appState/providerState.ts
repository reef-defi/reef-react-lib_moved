import { ReplaySubject, shareReplay } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import { Network } from '../state';

const providerSubj: ReplaySubject<Provider> = new ReplaySubject<Provider>(1);
const selectedNetworkSubj: ReplaySubject<Network> = new ReplaySubject<Network>();

export const ACTIVE_NETWORK_LS_KEY = 'reef-app-active-network';
export const currentProvider$ = providerSubj.asObservable().pipe(shareReplay(1));
export const setCurrentProvider = (provider: Provider): void => providerSubj.next(provider);

export const currentNetwork$ = selectedNetworkSubj.asObservable();
export const setCurrentNetwork = (network: Network): void => {
  if (network != null) {
    localStorage.setItem(ACTIVE_NETWORK_LS_KEY, JSON.stringify(network));
  }
  selectedNetworkSubj.next(network);
};
currentNetwork$.subscribe((network) => console.log('SELECTED NETWORK=', network.rpcUrl));
