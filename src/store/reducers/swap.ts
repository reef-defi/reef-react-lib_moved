import BigNumber from 'bignumber.js';
import {
  createEmptyTokenWithAmount, defaultSettings, Pool, Settings, TokenWithAmount,
} from '../../state';
import { assertAmount, getInputAmount, getOutputAmount } from '../../utils';
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
  let percentage = 0;
  let sellAmount = new BigNumber(0);
  let buyAmount = new BigNumber(0);
  const maxSellAmount = new BigNumber(token1.balance.toString()).div(new BigNumber(10).pow(token1.decimals));
  const maxBuyAmount = new BigNumber(pool ? getOutputAmount({ ...token2, amount: maxSellAmount.toString() }, pool) : '0');
  switch (action.type) {
    case SET_TOKEN1_AMOUNT:
      sellAmount = new BigNumber(assertAmount(action.amount));
      buyAmount = new BigNumber(
        pool
          ? getOutputAmount({ ...token2, amount: sellAmount.toString() }, pool)
          : '0'
      )
      if (sellAmount.lt(0)) {
        buyAmount = new BigNumber(0);
        sellAmount = new BigNumber(0);
      }
      if (sellAmount.gt(maxSellAmount)) {
        sellAmount = maxSellAmount;
        buyAmount = maxBuyAmount;
      }
      percentage = sellAmount.multipliedBy(new BigNumber(10).pow(token1.decimals)).div(token1.balance.toString()).multipliedBy(100).toNumber();
      return {
        ...state,
        focus: 'sell',
        percentage,
        token1: {
          ...token1,
          amount: sellAmount.toString(),
        },
        token2: {
          ...token2,
          amount: buyAmount.toFixed(4)
        },
      };
    case SET_TOKEN2_AMOUNT:
      buyAmount = new BigNumber(assertAmount(action.amount));
      sellAmount = new BigNumber(
        pool
          ? getInputAmount({ ...token2, amount: buyAmount.toString() }, pool)
          : '0'
      )
      if (buyAmount.lt(0)) {
        buyAmount = new BigNumber(0);
        sellAmount = new BigNumber(0);
      }
      if (sellAmount.gt(maxSellAmount)) {
        sellAmount = maxSellAmount;
        buyAmount = maxBuyAmount;
      }
      percentage = sellAmount.multipliedBy(new BigNumber(10).pow(token1.decimals)).div(token1.balance.toString()).multipliedBy(100).toNumber();
      return {
        ...state,
        percentage,
        focus: 'buy',
        token1: {
          ...token1,
          amount: sellAmount.toFixed(4),
        },
        token2: {
          ...token2,
          amount: buyAmount.toString(),
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
      percentage: 0,
      token2: { ...state.token2, amount: '' },
      token1: { ...createEmptyTokenWithAmount(false), ...action.token, amount: '' },
    };
    case SET_TOKEN2: return {
      ...state,
      percentage: 0,
      token1: { ...state.token1, amount: '' },
      token2: { ...createEmptyTokenWithAmount(false), ...action.token, amount: '' },
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
