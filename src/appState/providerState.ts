import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import { Network, Networks } from '../state';
import { availableReefNetworks } from '../utils';

export const providerSubj: ReplaySubject<Provider> = new ReplaySubject<Provider>(1);
export const networksSubj: BehaviorSubject<Networks> = new BehaviorSubject<Networks>(availableReefNetworks);
export const selectedNetworkSubj: ReplaySubject<Network> = new ReplaySubject<Network>();
selectedNetworkSubj.subscribe((network) => console.log('SELECTED NETWORK=', network.rpcUrl));

export const setCurrentNetwork = (network: Network): void => {
  selectedNetworkSubj.next(network);
};
