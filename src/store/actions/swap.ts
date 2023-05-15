import { Settings, Token } from '../../state';
import { SET_FOCUS } from '../actionTypes';
import {
  ClearTokenAmounts, SetCompleteStatus, SetLoading, SetPercentage, SetPool, SetSettings, SetStatus, SetToken1, SetToken1Amount, SetToken2, SetToken2Amount, SetTokenPrices, SetValidity, SwitchTokens,
} from './defaultActions';

export type SwapFocus = 'buy' | 'sell';

// Action types
type SetFocus = {
  type: typeof SET_FOCUS;
  focus: SwapFocus;
};

export type SwapAction =
  | SetToken2
  | SetPool
  | SetToken1
  | SetFocus
  | SetStatus
  | SetLoading
  | SetValidity
  | SetSettings
  | SetPercentage
  | SwitchTokens
  | SetToken2Amount
  | SetCompleteStatus
  | ClearTokenAmounts
  | SetToken1Amount
  | SetTokenPrices;

// Action creators
export const setFocusAction = (focus: SwapFocus): SetFocus => ({
  focus,
  type: SET_FOCUS,
});

export interface SwapComponentActions {
  onSwap: () => Promise<void>;
  onSwitch: () => void;
  selectToken1: (token: Token) => void;
  selectToken2: (token: Token) => void;
  setSettings: (settings: Settings) => void;
  setPercentage: (amount: number) => void;
  setToken1Amount: (amount: string) => void;
  setToken2Amount: (amount: string) => void;
  onAddressChange: (address: string) => Promise<void>;
}
