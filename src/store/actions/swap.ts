import { createEmptyTokenWithAmount, Pool, Settings, Token, TokenWithAmount } from "../../state";
import {
  SET_COMPLETE_STATUS, SET_FOCUS, SET_LOADING, SET_POOL, SET_SETTINGS, SET_STATUS, SET_TOKEN1, SET_TOKEN1_AMOUNT, SET_TOKEN2, SET_TOKEN2_AMOUNT, SET_VALIDITY, SWITCH_TOKENS
} from "../actionTypes";

export type SwapFocus = "buy" | "sell";

// Action types
type SetAmount<T> = {
  type: T;
  amount: string;
};
type SetToken<T> = {
  type: T;
  token: TokenWithAmount;
};
type SetToken1 = SetToken<typeof SET_TOKEN1>;
type SetToken2 = SetToken<typeof SET_TOKEN2>;
type SetToken1Amount = SetAmount<typeof SET_TOKEN1_AMOUNT>;
type SetToken2Amount = SetAmount<typeof SET_TOKEN2_AMOUNT>;
type SetSettings = {
  type: typeof SET_SETTINGS;
  settings: Settings;
};
type SetFocus = {
  type: typeof SET_FOCUS;
  focus: SwapFocus;
};
type SwitchTokens = {
  type: typeof SWITCH_TOKENS;
};
type SetPool = {
  type: typeof SET_POOL;
  pool: Pool;
};
type SetLoading = {
  type: typeof SET_LOADING;
  loading: boolean;
}
type SetCompleteStatus = {
  type: typeof SET_COMPLETE_STATUS;
  status: string;
  isValid: boolean;
  isLoading: boolean;
}
type SetStatus = {
  type: typeof SET_STATUS;
  status: string;
}
type SetValidity = {
  type: typeof SET_VALIDITY;
  isValid: boolean;
}

export type SwapAction =
  | SetToken2
  | SetPool
  | SetToken1
  | SetFocus
  | SetStatus
  | SetLoading
  | SetValidity
  | SetSettings
  | SwitchTokens
  | SetToken2Amount
  | SetCompleteStatus
  | SetToken1Amount;

// Action creators
export const setPoolAction = (pool: Pool): SetPool => ({
  pool,
  type: SET_POOL,
});
export const setToken1Action = (token: Token): SetToken1 => ({
  token: {...createEmptyTokenWithAmount(false), ...token},
  type: SET_TOKEN1,
});
export const setToken2Action = (token: Token): SetToken2 => ({
  token: {...createEmptyTokenWithAmount(false), ...token},
  type: SET_TOKEN2,
});
export const setFocusAction = (focus: SwapFocus): SetFocus => ({
  focus,
  type: SET_FOCUS,
});
export const setSettingsAction = (settings: Settings): SetSettings => ({
  settings,
  type: SET_SETTINGS,
});
export const setToken1AmountAction = (amount: string): SetToken1Amount => ({
  amount,
  type: SET_TOKEN1_AMOUNT,
});
export const setToken2AmountAction = (amount: string): SetToken2Amount => ({
  amount,
  type: SET_TOKEN2_AMOUNT,
});
export const switchTokensAction = (): SwitchTokens => ({
  type: SWITCH_TOKENS,
});
export const setLoadingAction = (loading: boolean): SetLoading => ({
  type: SET_LOADING,
  loading,
});
export const setStatusAction = (status: string): SetStatus => ({
  type: SET_STATUS,
  status,
});
export const setCompleteStatusAction = (status: string, isValid: boolean, isLoading: boolean): SetCompleteStatus => ({
  type: SET_COMPLETE_STATUS,
  status,
  isValid,
  isLoading,
});
export const setValidityAction = (isValid: boolean): SetValidity => ({
  type: SET_VALIDITY,
  isValid,
});

export interface SwapComponentActions {
  onSwap: () => Promise<void>;
  onSwitch: () => void;
  selectToken1: (token: Token) => void;
  selectToken2: (token: Token) => void;
  setSettings: (settings: Settings) => void;
  setToken1Amount: (amount: string) => void;
  setToken2Amount: (amount: string) => void;
  onAddressChange: (address: string) => Promise<void>;
}
