import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import { availableNetworks, Network, Networks } from '../state';

export const providerSubj: ReplaySubject<Provider> = new ReplaySubject<Provider>(1);
export const networksSubj: BehaviorSubject<Networks> = new BehaviorSubject<Networks>(availableNetworks);
export const selectedNetworkSubj: ReplaySubject<Network> = new ReplaySubject<Network>();
selectedNetworkSubj.subscribe((network) => console.log('SELECTED NETWORK=', network.rpcUrl));

export const setCurrentNetwork = (network: Network): void => selectedNetworkSubj.next(network);
