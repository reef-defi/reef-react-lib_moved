import { Observable} from 'rxjs';
import { Provider } from '@reef-defi/evm-provider';
import {
  reefState,
} from '@reef-chain/util-lib';
import { Network } from '../state';

export const ACTIVE_NETWORK_LS_KEY = 'reef-app-active-network';
export const currentProvider$ = reefState.selectedProvider$ as Observable<Provider>;
export const currentNetwork$ = reefState.selectedNetwork$ as Observable<Network>;
export const setCurrentNetwork = reefState.setSelectedNetwork;