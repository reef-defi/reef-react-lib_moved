import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import { Network, Networks } from '../state';
import { availableReefNetworks } from '../utils';

export const providerSubj = new ReplaySubject<Provider>(1);
export const networksSubj = new BehaviorSubject<Networks>(availableReefNetworks);
export const selectedNetworkSubj = new Subject<Network>();
selectedNetworkSubj.subscribe((network) => console.log('NETWORK=', network.rpcUrl));

export const setCurrentNetwork = (network: Network): void => {
  selectedNetworkSubj.next(network);
};
