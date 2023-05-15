import {
  AddressToNumber,
  createEmptyTokenWithAmount,
  Pool,
  Settings,
  Token,
  TokenWithAmount,
} from '../../state';
import {
  CLEAR_TOKEN_AMOUNTS,
  SET_COMPLETE_STATUS,
  SET_LOADING,
  SET_PERCENTAGE,
  SET_POOL,
  SET_SETTINGS,
  SET_STATUS,
  SET_TOKEN1,
  SET_TOKEN1_AMOUNT,
  SET_TOKEN2,
  SET_TOKEN2_AMOUNT,
  SET_VALIDITY,
  SWITCH_TOKENS,
  SET_TOKEN_PRICES,
} from '../actionTypes';

type SetAmount<T> = {
  type: T;
  amount: string;
};
type SetToken<T> = {
  type: T;
  token: TokenWithAmount;
};
type SetPrices<T> = {
  type: T;
  tokenPrices: AddressToNumber<number>;
};
export type SetToken1 = SetToken<typeof SET_TOKEN1>;
export type SetToken2 = SetToken<typeof SET_TOKEN2>;
export type SetToken1Amount = SetAmount<typeof SET_TOKEN1_AMOUNT>;
export type SetToken2Amount = SetAmount<typeof SET_TOKEN2_AMOUNT>;
export type SetTokenPrices = SetPrices<typeof SET_TOKEN_PRICES>;
export type SetSettings = {
  type: typeof SET_SETTINGS;
  settings: Settings;
};
export type SwitchTokens = {
  type: typeof SWITCH_TOKENS;
};
export type SetPool = {
  type: typeof SET_POOL;
  pool?: Pool;
};
export type SetLoading = {
  type: typeof SET_LOADING;
  loading: boolean;
};
export type SetCompleteStatus = {
  type: typeof SET_COMPLETE_STATUS;
  status: string;
  isValid: boolean;
  isLoading: boolean;
};
export type SetStatus = {
  type: typeof SET_STATUS;
  status: string;
};
export type SetValidity = {
  type: typeof SET_VALIDITY;
  isValid: boolean;
};
export type ClearTokenAmounts = {
  type: typeof CLEAR_TOKEN_AMOUNTS;
};

export type SetPercentage = {
  type: typeof SET_PERCENTAGE;
  percentage: number;
}

export const setPercentageAction = (percentage: number): SetPercentage => ({
  percentage,
  type: SET_PERCENTAGE,
});

export const setPoolAction = (pool?: Pool): SetPool => ({
  pool,
  type: SET_POOL,
});
export const setToken1Action = (token: Token): SetToken1 => ({
  token: { ...createEmptyTokenWithAmount(false), ...token },
  type: SET_TOKEN1,
});
export const setToken2Action = (token: Token): SetToken2 => ({
  token: { ...createEmptyTokenWithAmount(false), ...token },
  type: SET_TOKEN2,
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
export const setTokenPricesAction = (tokenPrices: AddressToNumber<number>): SetTokenPrices => ({
  tokenPrices,
  type: SET_TOKEN_PRICES,
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
export const setCompleteStatusAction = (
  status: string,
  isValid: boolean,
  isLoading: boolean,
): SetCompleteStatus => ({
  type: SET_COMPLETE_STATUS,
  status,
  isValid,
  isLoading,
});
export const setValidityAction = (isValid: boolean): SetValidity => ({
  type: SET_VALIDITY,
  isValid,
});
export const clearTokenAmountsAction = (): ClearTokenAmounts => ({
  type: CLEAR_TOKEN_AMOUNTS,
});
