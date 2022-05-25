import { BigNumber } from 'ethers';
import {
  createEmptyTokenWithAmount,
  defaultSettings,
  Pool, Settings,
  TokenWithAmount,
} from '../../state';
import { AddLiquidityActions } from '../actions/addLiquidity';
import {
  CLEAR_TOKEN_AMOUNTS,
  SET_COMPLETE_STATUS,
  SET_LOADING,
  SET_NEW_POOL_SUPPLY,
  SET_POOL,
  SET_SETTINGS,
  SET_STATUS,
  SET_TOKEN1,
  SET_TOKEN1_AMOUNT,
  SET_TOKEN2,
  SET_TOKEN2_AMOUNT,
  SET_VALIDITY,
} from '../actionTypes';

export interface AddLiquidityState {
  status: string;
  isValid: boolean;
  settings: Settings;
  isLoading: boolean;
  token2: TokenWithAmount;
  token1: TokenWithAmount;
  pool: Pool | undefined;
  newPoolSupply: string;
}

export const initialAddLiquidityState: AddLiquidityState = {
  status: '',
  isValid: false,
  isLoading: false,
  pool: undefined,
  newPoolSupply: '',
  settings: defaultSettings(),
  token1: createEmptyTokenWithAmount(),
  token2: createEmptyTokenWithAmount(),
};

const calculateOtherAmount = (amount: string, currentAmount: string, first: boolean, pool?: Pool): string => {
  if (!pool || !amount || !pool) { return currentAmount; }

  const [r1, r2] = first
    ? [pool.reserve1, pool.reserve2]
    : [pool.reserve2, pool.reserve1];

  const ratio = BigNumber.from(r1).mul(10000000).div(r2).toNumber() / 10000000;
  return (ratio * parseFloat(amount)).toFixed(4);
};

export const addLiquidityReducer = (
  state = initialAddLiquidityState,
  action: AddLiquidityActions,
): AddLiquidityState => {
  const { token1, token2, pool } = state;
  switch (action.type) {
    case SET_TOKEN1:
      return {
        ...state,
        token1: { ...createEmptyTokenWithAmount(false), ...action.token },
      };
    case SET_TOKEN2:
      return {
        ...state,
        token2: { ...createEmptyTokenWithAmount(false), ...action.token },
      };
    case SET_TOKEN1_AMOUNT:
      return {
        ...state,
        token1: { ...token1, amount: action.amount },
        token2: { ...token2, amount: calculateOtherAmount(action.amount, token2.amount, true, pool) },
      };
    case SET_TOKEN2_AMOUNT:
      return {
        ...state,
        token2: { ...token2, amount: action.amount },
        token1: { ...token1, amount: calculateOtherAmount(action.amount, token1.amount, false, pool) },
      };
    case SET_STATUS:
      return { ...state, status: action.status };
    case SET_VALIDITY:
      return { ...state, isValid: action.isValid };
    case SET_LOADING:
      return { ...state, isLoading: action.loading };
    case SET_POOL:
      return { ...state, pool: action.pool };
    case SET_NEW_POOL_SUPPLY:
      return { ...state, newPoolSupply: action.supply };
    case SET_SETTINGS:
      return { ...state, settings: { ...action.settings } };
    case CLEAR_TOKEN_AMOUNTS:
      return {
        ...state,
        token1: { ...token1, amount: '' },
        token2: { ...token2, amount: '' },
      };
    case SET_COMPLETE_STATUS:
      return {
        ...state,
        isLoading: action.isLoading,
        isValid: action.isValid,
        status: action.status,
      };
    default: return state;
  }
};
