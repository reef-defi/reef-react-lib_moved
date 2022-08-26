import BigNumber from 'bignumber.js';
import {
  createEmptyTokenWithAmount, defaultSettings, Pool, Settings, TokenWithAmount,
} from '../../state';
import { getInputAmount, getOutputAmount } from '../../utils';
import { SwapAction, SwapFocus } from '../actions/swap';
import {
  CLEAR_TOKEN_AMOUNTS, SET_COMPLETE_STATUS, SET_LOADING, SET_PERCENTAGE, SET_POOL, SET_SETTINGS, SET_STATUS, SET_TOKEN1, SET_TOKEN1_AMOUNT, SET_TOKEN2, SET_TOKEN2_AMOUNT, SET_VALIDITY, SWITCH_TOKENS,
} from '../actionTypes';

export interface SwapState {
  status: string;
  focus: SwapFocus;
  percentage: number;
  isValid: boolean;
  settings: Settings;
  isLoading: boolean;
  token2: TokenWithAmount;
  token1: TokenWithAmount;
  pool: Pool | undefined;
}

export const initialSwapState: SwapState = {
  status: '',
  focus: 'sell',
  percentage: 0,
  pool: undefined,
  isValid: false,
  isLoading: false,
  settings: defaultSettings(),
  token1: createEmptyTokenWithAmount(), // token1 token
  token2: createEmptyTokenWithAmount(), // token2 token
};

const applyPercentage = (state: SwapState, percentage: number): SwapState => {
  const amount = new BigNumber(state.token1.balance.toString())
    .multipliedBy(percentage)
    .div(100)
    .div(new BigNumber(10).pow(state.token1.decimals));

  return {
    ...state,
    percentage,
    token1: { ...state.token1, amount: amount.toFixed(2) }, // TODO s
    token2: { ...state.token2, amount: state.pool ? getOutputAmount({ ...state.token1, amount: amount.toString() }, state.pool).toFixed(2) : '' },
  };
};

export const swapReducer = (state = initialSwapState, action: SwapAction): SwapState => {
  const {
    token1, token2, pool, focus,
  } = state;
  switch (action.type) {
    case SET_TOKEN1_AMOUNT: return {
      ...state,
      focus: 'sell',
      token1: { ...token1, amount: action.amount },
      token2: {
        ...token2,
        amount: pool && action.amount
          ? getOutputAmount({ ...token1, amount: action.amount }, pool).toFixed(4)
          : '',
      },
      percentage: action.amount === '' ? 0 : Math.min(new BigNumber(action.amount).multipliedBy(new BigNumber(10).pow(state.token1.decimals)).div(token1.balance.toString()).multipliedBy(100)
        .toNumber(), 100),
    };
    case SET_TOKEN2_AMOUNT:
      const otherAmount = pool && action.amount
        ? getInputAmount({ ...token2, amount: action.amount }, pool).toFixed(4)
        : '';
      return {
        ...state,
        focus: 'buy',
        token2: { ...token2, amount: action.amount },
        token1: {
          ...token1,
          amount: otherAmount,
        },
        percentage: otherAmount === '' ? 0 : Math.min(new BigNumber(otherAmount).multipliedBy(new BigNumber(10).pow(state.token1.decimals)).div(token1.balance.toString()).multipliedBy(100)
          .toNumber(), 100),
      };
    case SWITCH_TOKENS: return {
      ...state,
      token1: { ...token2 },
      token2: { ...token1 },
      focus: focus === 'sell' ? 'buy' : 'sell',
    };
    case SET_TOKEN1: return {
      ...state,
      token1: { ...createEmptyTokenWithAmount(false), ...action.token },
    };
    case SET_TOKEN2: return {
      ...state,
      token2: { ...createEmptyTokenWithAmount(false), ...action.token },
    };
    case SET_POOL: return { ...state, pool: action.pool };
    case SET_STATUS: return { ...state, status: action.status };
    case SET_LOADING: return { ...state, isLoading: action.loading };
    case SET_VALIDITY: return { ...state, isValid: action.isValid };
    case SET_SETTINGS: return { ...state, settings: { ...action.settings } };
    case SET_PERCENTAGE: return applyPercentage(state, action.percentage);
    case SET_COMPLETE_STATUS: return {
      ...state,
      isLoading: action.isLoading,
      isValid: action.isValid,
      status: action.status,
    };
    case CLEAR_TOKEN_AMOUNTS: return {
      ...state,
      percentage: 0,
      token1: { ...token1, amount: '' },
      token2: { ...token2, amount: '' },
    };
    default: return state;
  }
};
