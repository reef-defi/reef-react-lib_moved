import { BigNumber } from 'ethers';
import { ensure } from '../utils/utils';
import { calculateAmount } from '../utils/math';

export interface BasicToken {
  name: string;
  address: string;
  iconUrl: string;
}

export interface Token extends BasicToken {
  symbol?: string;
  balance: BigNumber;
  decimals: number;
}

export interface TokenWithAmount extends Token {
  amount: string;
  price: number;
  isEmpty: boolean;
}

export interface TokenState {
  index: number;
  amount: string;
  price: number;
}

export const defaultTokenState = (index = 0): TokenState => ({
  index,
  amount: '',
  price: 0,
});

export const createEmptyToken = (): Token => ({
  name: 'Select token',
  address: '',
  balance: BigNumber.from('0'),
  decimals: -1,
  iconUrl: '',
});

export const createEmptyTokenWithAmount = (isEmpty = true): TokenWithAmount => ({
  ...createEmptyToken(),
  isEmpty,
  price: -1,
  amount: '',
});

export const toTokenAmount = (
  token: Token,
  state: TokenState,
): TokenWithAmount => ({
  ...token,
  ...state,
  isEmpty: false,
});

export const ensureTokenAmount = (token: TokenWithAmount): void => ensure(
  BigNumber.from(calculateAmount(token)).lte(token.balance),
  `Insufficient ${token.name} balance`,
);

export const reefTokenWithAmount = (): TokenWithAmount => toTokenAmount(
  {
    name: 'REEF',
    address: '0x0000000000000000000000000000000001000000',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png',
    balance: BigNumber.from(0),
    decimals: 18,
  },
  {
    amount: '',
    index: -1,
    price: 0,
  },
);
