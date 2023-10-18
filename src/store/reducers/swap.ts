import BigNumber from 'bignumber.js';
import {
  createEmptyTokenWithAmount, defaultSettings, Pool, Settings, TokenWithAmount,
} from '../../state';
import { assertAmount, getInputAmount, getOutputAmount } from '../../utils';
import { SwapAction, SwapFocus } from '../actions/swap';
import {
  CLEAR_TOKEN_AMOUNTS, SET_COMPLETE_STATUS, SET_LOADING, SET_PERCENTAGE, SET_POOL, SET_SETTINGS,
  SET_STATUS, SET_TOKEN1, SET_TOKEN1_AMOUNT, SET_TOKEN2, SET_TOKEN2_AMOUNT, SET_VALIDITY,
  SWITCH_TOKENS, SET_TOKEN_PRICES,
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

  if (pool?.token2.address === token1.address && pool?.token1.address === token2.address) {
    // Switch order of tokens
    const poolToken1 = pool.token2;
    const poolToken2 = pool.token1;
    const poolReserve1 = pool.reserve2;
    const poolReserve2 = pool.reserve1;
    pool.token1 = poolToken1;
    pool.token2 = poolToken2;
    pool.reserve1 = poolReserve1;
    pool.reserve2 = poolReserve2;
  }

  let percentage = 0;
  let sellAmount = new BigNumber(0);
  let buyAmount = new BigNumber(0);
  const maxSellAmount = new BigNumber(token1.balance.toString()).div(new BigNumber(10).pow(token1.decimals));
  const maxBuyAmount = new BigNumber(pool ? getOutputAmount({ ...token2, amount: maxSellAmount.toString() }, pool) : '0');
  const MAX_DECIMALS = 4;

  switch (action.type) {
    case SET_TOKEN1_AMOUNT:
      if (!state.pool) {
        return state;
      }

      sellAmount = new BigNumber(assertAmount(action.amount));
      buyAmount = new BigNumber(getOutputAmount({ ...token2, amount: sellAmount.toString() }, state.pool));

      if (sellAmount.lt(0)) {
        return {
          ...state,
          token1: { ...token1, amount: '0' },
          token2: { ...token2, amount: '0' },
          percentage: 0,
        };
      }
      if (sellAmount.gt(maxSellAmount)) {
        return {
          ...state,
          token1: { ...token1, amount: maxSellAmount.toFixed(MAX_DECIMALS).replace(/\.?0+$/, '') },
          token2: { ...token2, amount: maxBuyAmount.toFixed(MAX_DECIMALS).replace(/\.?0+$/, '') },
          percentage: 100,
        };
      }
      percentage = token1.balance.lte(0)
        ? 0
        : sellAmount
          .multipliedBy(new BigNumber(10).pow(token1.decimals))
          .div(token1.balance.toString())
          .multipliedBy(100)
          .toNumber();
      return {
        ...state,
        focus: 'sell',
        percentage,
        token1: {
          ...token1,
          amount: action.amount,
        },
        token2: {
          ...token2,
          amount: buyAmount.toFixed(MAX_DECIMALS).replace(/\.?0+$/, ''),
        },
      };
    case SET_TOKEN2_AMOUNT:
      if (!state.pool) {
        return state;
      }

      buyAmount = new BigNumber(assertAmount(action.amount));
      sellAmount = new BigNumber(getInputAmount({ ...token2, amount: buyAmount.toString() }, state.pool));

      if (buyAmount.lt(0)) {
        return {
          ...state,
          token1: { ...token1, amount: '0' },
          token2: { ...token2, amount: '0' },
          percentage: 0,
        };
      }
      if (sellAmount.gt(maxSellAmount)) {
        return {
          ...state,
          token1: { ...token1, amount: maxSellAmount.toFixed(MAX_DECIMALS).replace(/\.?0+$/, '') },
          token2: { ...token2, amount: maxBuyAmount.toFixed(MAX_DECIMALS).replace(/\.?0+$/, '') },
          percentage: 100,
        };
      }

      percentage = token1.balance.lte(0)
        ? 0
        : sellAmount
          .multipliedBy(new BigNumber(10).pow(token1.decimals))
          .div(token1.balance.toString())
          .multipliedBy(100)
          .toNumber();

      return {
        ...state,
        focus: 'buy',
        percentage,
        token1: { ...token1, amount: sellAmount.toFixed(MAX_DECIMALS).replace(/\.?0+$/, '') },
        token2: { ...token2, amount: action.amount },
      };
    case SET_TOKEN_PRICES:
      if (!state.pool) {
        return state;
      }

      return {
        ...state,
        token1: { ...token1, price: action.tokenPrices[token1.address] || token1.price },
        token2: { ...token2, price: action.tokenPrices[token2.address] || token2.price },
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
