import { BigNumber } from 'ethers';
import {
  createEmptyTokenWithAmount, defaultSettings, Pool, Settings, TokenWithAmount,
} from '../../state';
import { RemoveLiquidityActions } from '../actions';
import {
  SET_COMPLETE_STATUS, SET_LOADING, SET_PERCENTAGE, SET_POOL, SET_SETTINGS, SET_STATUS, SET_TOKEN1, SET_TOKEN2, SET_VALIDITY,
} from '../actionTypes';

export interface RemoveLiquidityState {
  token1: TokenWithAmount;
  token2: TokenWithAmount;
  status: string;
  percentage: number;
  isLoading: boolean;
  isValid: boolean;
  pool?: Pool;
  settings: Settings;
}

export const initialRemoveLiquidityState: RemoveLiquidityState = {
  status: '',
  percentage: 0,
  isLoading: false,
  isValid: false,
  settings: defaultSettings(),
  token1: createEmptyTokenWithAmount(),
  token2: createEmptyTokenWithAmount(),
};

export const removeLiquidityReducer = (state = initialRemoveLiquidityState, action: RemoveLiquidityActions): RemoveLiquidityState => {
  switch (action.type) {
    case SET_POOL: return { ...state, pool: action.pool };
    case SET_STATUS: return { ...state, status: action.status };
    case SET_TOKEN1: return { ...state, token1: { ...action.token } };
    case SET_TOKEN2: return { ...state, token2: { ...action.token } };
    case SET_LOADING: return { ...state, isLoading: action.loading };
    case SET_VALIDITY: return { ...state, isValid: action.isValid };
    case SET_SETTINGS: return { ...state, settings: { ...action.settings } };
    case SET_PERCENTAGE: return {
      ...state,
      token1: {
        ...state.token1,
        amount: state.pool!.token1.balance.div(BigNumber.from(10).pow(state.token1.decimals)).div(100).mul(action.percentage).toString(),
      },
      token2: {
        ...state.token2,
        amount: state.pool!.token2.balance.div(BigNumber.from(10).pow(state.token2.decimals)).div(100).mul(action.percentage).toString(),
      },
      percentage: action.percentage,
    };
    case SET_COMPLETE_STATUS: return {
      ...state, status: action.status, isLoading: action.isLoading, isValid: action.isValid,
    };
    default: return state;
  }
};
