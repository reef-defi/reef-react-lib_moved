import { Settings, TokenWithAmount, defaultSettings, reefTokenWithAmount, createEmptyTokenWithAmount, Pool } from "../../state";
import { getInputAmount, getOutputAmount } from "../../utils";
import { SwapAction, SwapFocus } from "../actions/swap";
import { SET_TOKEN2_AMOUNT, SET_LOADING, SET_POOL, SET_TOKEN1, SET_STATUS, SET_VALIDITY, SWITCH_TOKENS, SET_TOKEN2, SET_TOKEN1_AMOUNT, SET_COMPLETE_STATUS } from "../actionTypes";

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
  status: "",
  focus: "sell",
  pool: undefined,
  isValid: false,
  isLoading: false,
  settings: defaultSettings(),
  token1: reefTokenWithAmount(), // sell token
  token2: createEmptyTokenWithAmount(), // buy token
}

export const swapReducer = (state=initialSwapState, action: SwapAction): SwapState => {
  const {token1: sell, token2: buy, pool, focus} = state;
  switch(action.type) {
    case SET_TOKEN1_AMOUNT: return {...state,
        focus: 'sell',
        token1: {...sell, amount: action.amount},
        token2: {...buy,
          amount: pool && action.amount
            ? getOutputAmount({...sell, amount: action.amount}, pool).toFixed(4)
            : ''
        }
      };
    case SET_TOKEN2_AMOUNT: return {...state,
      focus: 'buy',
      token2: {...buy, amount: action.amount},
      token1: {...sell,
        amount: pool && action.amount
          ? getInputAmount({...buy, amount: action.amount}, pool).toFixed(4)
          : ''
      }
    }
    case SWITCH_TOKENS: return {...state,
      token1: {...buy},
      token2: {...sell},
      focus: focus === 'buy' ? 'sell' : 'buy',
    }
    case SET_TOKEN1: return {...state,
      token1: {...createEmptyTokenWithAmount(false), ...action.token},
    };
    case SET_TOKEN2: return {...state,
      token2: {...createEmptyTokenWithAmount(false), ...action.token},
    };
    case SET_POOL: return {...state, pool: action.pool};
    case SET_STATUS: return {...state, status: action.status};
    case SET_LOADING: return {...state, isLoading: action.loading};
    case SET_VALIDITY: return {...state, isValid: action.isValid};
    case SET_COMPLETE_STATUS: return {...state,
      isLoading: action.isLoading,
      isValid: action.isValid,
      status: action.status,
    }
    default: return state;
  }
}
