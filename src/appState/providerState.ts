import { ReplaySubject } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import { Network } from '../state';

const providerSubj: ReplaySubject<Provider> = new ReplaySubject<Provider>(1);
const selectedNetworkSubj: ReplaySubject<Network> = new ReplaySubject<Network>();

export const currentProvider$ = providerSubj.asObservable();
export const setCurrentProvider = (provider: Provider): void => providerSubj.next(provider);

export const currentNetwork$ = selectedNetworkSubj.asObservable();
export const setCurrentNetwork = (network: Network): void => selectedNetworkSubj.next(network);
currentNetwork$.subscribe((network) => console.log('SELECTED NETWORK=', network.rpcUrl));
