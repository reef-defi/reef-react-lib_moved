import BigNumber from 'bignumber.js';
import {
  createEmptyTokenWithAmount,
  defaultSettings,
  Pool, Settings,
  Token,
  TokenWithAmount,
} from '../../state';
import { assertAmount } from '../../utils';
import { AddLiquidityActions } from '../actions/addLiquidity';
import {
  CLEAR_TOKEN_AMOUNTS,
  SET_COMPLETE_STATUS,
  SET_LOADING,
  SET_NEW_POOL_SUPPLY,
  SET_PERCENTAGE,
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
  percentage: number;
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
  percentage: 0,
  isLoading: false,
  pool: undefined,
  newPoolSupply: '',
  settings: defaultSettings(),
  token1: createEmptyTokenWithAmount(),
  token2: createEmptyTokenWithAmount(),
};

type MaxToken = [BigNumber, BigNumber]
const maxToken = (token: Token, pool?: Pool): MaxToken => {
  if (!pool || pool.reserve1 === '0' || pool.reserve2 === '0') {
    return [
      new BigNumber(0),
      new BigNumber(0),
    ];
  }

  const tokenReserve = pool.token1.address === token.address
    ? pool.reserve1 : pool.reserve2;
  const otherReserve = pool.token1.address !== token.address
    ? pool.reserve1 : pool.reserve2;

  const maxTokenAmount = new BigNumber(token.balance.toString())
    .div(new BigNumber(10).pow(token.decimals));
  const maxOtherAmount = maxTokenAmount
    .multipliedBy(otherReserve)
    .div(tokenReserve);
  return [
    maxTokenAmount,
    maxOtherAmount,
  ];
};

const maxValues = (state: AddLiquidityState): MaxToken => {
  const max1 = maxToken(state.token1, state.pool);
  const max2 = maxToken(state.token2, state.pool);

  if (max1[1].gt(max2[0])) {
    return [max2[1], max2[0]];
  }
  return max1;
};

export const addLiquidityReducer = (
  state = initialAddLiquidityState,
  action: AddLiquidityActions,
): AddLiquidityState => {
  const maxValue = maxValues(state);
  let amount = new BigNumber(0);
  let otherAmount = new BigNumber(0);
  let reserve1 = '0';
  let reserve2 = '0';

  if (state.pool) {
    reserve1 = state.token1.address === state.pool.token1.address
      ? state.pool.reserve1 : state.pool.reserve2;
    reserve2 = state.token1.address !== state.pool.token1.address
      ? state.pool.reserve1 : state.pool.reserve2;
  }

  const { token1, token2 } = state;
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
      if (!state.pool || state.pool.reserve1 === '0' || state.pool.reserve2 === '0') {
        return {
          ...state,
          percentage: 0,
          token1: { ...state.token1, amount: action.amount },
        };
      }
      if (action.amount === '') {
        return {
          ...state,
          percentage: 0,
          token1: { ...state.token1, amount: '' },
          token2: { ...state.token2, amount: '' },
        };
      }

      amount = new BigNumber(assertAmount(action.amount));
      otherAmount = amount.multipliedBy(reserve2).div(reserve1);

      if (amount.lt(0)) {
        return {
          ...state,
          percentage: 0,
          token1: { ...state.token1, amount: '0' },
          token2: { ...state.token2, amount: '0' },
        };
      }
      if (amount.gt(maxValue[0]) || otherAmount.gt(maxValue[1])) {
        return {
          ...state,
          percentage: 100,
          token1: { ...state.token1, amount: maxValue[0].toString() },
          token2: { ...state.token2, amount: maxValue[1].toString() },
        };
      }
      return {
        ...state,
        percentage: maxValue[0].lte(0)
          ? 0
          : amount.div(maxValue[0]).multipliedBy(100).toNumber(),
        token1: { ...state.token1, amount: action.amount },
        token2: { ...state.token2, amount: otherAmount.toString() },
      };
    case SET_TOKEN2_AMOUNT:
      if (!state.pool || state.pool.reserve1 === '0' || state.pool.reserve2 === '0') {
        return {
          ...state,
          percentage: 0,
          token2: { ...state.token2, amount: action.amount },
        };
      }
      if (action.amount === '') {
        return {
          ...state,
          percentage: 0,
          token1: { ...state.token1, amount: '' },
          token2: { ...state.token2, amount: '' },
        };
      }

      otherAmount = new BigNumber(assertAmount(action.amount));
      amount = otherAmount.multipliedBy(reserve1).div(reserve2);

      if (otherAmount.lt(0)) {
        return {
          ...state,
          percentage: 0,
          token1: { ...state.token1, amount: '0' },
          token2: { ...state.token2, amount: '0' },
        };
      }
      if (amount.gt(maxValue[0]) || otherAmount.gt(maxValue[1])) {
        return {
          ...state,
          percentage: 100,
          token1: { ...state.token1, amount: maxValue[0].toString() },
          token2: { ...state.token2, amount: maxValue[1].toString() },
        };
      }
      return {
        ...state,
        percentage: maxValue[0].lte(0)
          ? 0
          : amount.div(maxValue[0]).multipliedBy(100).toNumber(),
        token1: { ...state.token1, amount: amount.toString() },
        token2: { ...state.token2, amount: action.amount },
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
    case SET_PERCENTAGE:
      if (!state.pool) {
        return { ...state, percentage: action.percentage };
      }
      amount = maxValue[0].multipliedBy(action.percentage).div(100);
      otherAmount = maxValue[1].multipliedBy(action.percentage).div(100);
      return {
        ...state,
        percentage: action.percentage,
        token1: { ...state.token1, amount: amount.toString() },
        token2: { ...state.token2, amount: otherAmount.toString() },
      };
    case CLEAR_TOKEN_AMOUNTS:
      return {
        ...state,
        percentage: 0,
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
