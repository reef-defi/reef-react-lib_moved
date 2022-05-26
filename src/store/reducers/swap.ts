import {
  createEmptyTokenWithAmount, defaultSettings, Pool, Settings, TokenWithAmount,
} from '../../state';
import { getInputAmount, getOutputAmount } from '../../utils';
import { SwapAction, SwapFocus } from '../actions/swap';
import {
  CLEAR_TOKEN_AMOUNTS, SET_COMPLETE_STATUS, SET_LOADING, SET_POOL, SET_SETTINGS, SET_STATUS, SET_TOKEN1, SET_TOKEN1_AMOUNT, SET_TOKEN2, SET_TOKEN2_AMOUNT, SET_VALIDITY, SWITCH_TOKENS,
} from '../actionTypes';

export interface SwapState {
  status: string;
  focus: SwapFocus;
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
  pool: undefined,
  isValid: false,
  isLoading: false,
  settings: defaultSettings(),
  token1: createEmptyTokenWithAmount(), // token1 token
  token2: createEmptyTokenWithAmount(), // token2 token
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
    };
    case SET_TOKEN2_AMOUNT: return {
      ...state,
      focus: 'buy',
      token2: { ...token2, amount: action.amount },
      token1: {
        ...token1,
        amount: pool && action.amount
          ? getInputAmount({ ...token2, amount: action.amount }, pool).toFixed(4)
          : '',
      },
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
    case SET_COMPLETE_STATUS: return {
      ...state,
      isLoading: action.isLoading,
      isValid: action.isValid,
      status: action.status,
    };
    case CLEAR_TOKEN_AMOUNTS: return {
      ...state,
      token1: { ...token1, amount: '' },
      token2: { ...token2, amount: '' },
    };
    default: return state;
  }
};
