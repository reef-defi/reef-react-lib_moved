import { reefState } from '@reef-chain/util-lib';


export const ACTIVE_NETWORK_LS_KEY = 'reef-app-active-network';
export const currentProvider$ = reefState.selectedProvider$;

export const currentNetwork$ = reefState.selectedNetwork$;
export const setCurrentNetwork = reefState.setSelectedNetwork;
