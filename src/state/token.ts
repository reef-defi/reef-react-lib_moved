import {BigNumber} from 'ethers';
import {BigNumber as BN} from 'bignumber.js';
import {EMPTY_ADDRESS, ensure, MIN_EVM_TX_BALANCE, MIN_NATIVE_TX_BALANCE, REEF_ADDRESS} from '../utils/utils';
import {calculateAmount} from '../utils/math';
import {TokenPrices} from './pool';

export enum ContractType {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  other = 'other'
}

export interface ERC20ContractData {
  name: string;
  symbol: string;
  decimals: number;
}

export interface BasicToken {
  name: string;
  address: string;
  iconUrl: string;
}

export interface Token extends BasicToken {
  symbol: string;
  balance: BigNumber;
  decimals: number;
}

export interface TokenWithAmount extends Token {
  amount: string;
  price: number;
  isEmpty: boolean;
}

export interface TokenNFT extends Token {
  nftId: string;
  contractType: ContractType;
  mimetype?: string;
}

export interface TokenState {
  index: number;
  amount: string;
  price: number;
}

export interface NFTMetadata{
  image?: string;
  iconUrl?:string;
  name?: string;
  mimetype?: string;
}

export interface TransferExtrinsic { blockId: string; index: number; hash: string; }

export interface TokenTransfer {
  from: string;
  to: string;
  inbound: boolean;
  timestamp: number;
  token: Token|TokenNFT;
  extrinsic: TransferExtrinsic;
  url: string;
}

export const defaultTokenState = (index = 0): TokenState => ({
  index,
  amount: '',
  price: 0,
});

export const createEmptyToken = (): Token => ({
  name: 'Select token',
  address: EMPTY_ADDRESS,
  balance: BigNumber.from('0'),
  decimals: -1,
  iconUrl: '',
  symbol: 'Select token',
});

export const createEmptyTokenWithAmount = (isEmpty = true): TokenWithAmount => ({
  ...createEmptyToken(),
  isEmpty,
  price: 0,
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

export function isNativeTransfer(token: Token) {
  return token.address === REEF_ADDRESS;
}

export const checkMinExistentialReefAmount = (token: TokenWithAmount, reefBalance: BigNumber): {valid: boolean, message?: string, requiredBalanceMin: BigNumber} => {
  const amount = calculateAmount(token);
  const nativeTransfer = isNativeTransfer(token);
  const FIXED_TX_FEE = nativeTransfer ? 2 : 3;
  const minAmountBesidesTx = (nativeTransfer ? MIN_NATIVE_TX_BALANCE : MIN_EVM_TX_BALANCE);
  console.log("Exist min amt=",minAmountBesidesTx);
  const min = calculateAmount({ decimals: token.decimals, amount: (minAmountBesidesTx + FIXED_TX_FEE).toString() });
  const requiredBalanceMin = nativeTransfer ? BigNumber.from(min).add(BigNumber.from(amount)) : BigNumber.from(min);
  const valid = BigNumber.from(reefBalance).gte(requiredBalanceMin);
  const message = valid ? '' : `At least ${minAmountBesidesTx} REEF coins should be left to allow for transaction.`;
  return { valid, message, requiredBalanceMin };
};

export const ensureTokenAmount = (token: TokenWithAmount): void => ensure(
  BigNumber.from(calculateAmount(token)).lte(token.balance),
  `Insufficient ${token.name} balance`,
);

export const ensureExistentialReefAmount = (token: TokenWithAmount, reefBalance: BigNumber): void => {
  ensure(checkMinExistentialReefAmount(token, reefBalance).valid, `Insufficient ${token.name} balance.`);
};

export const REEF_TOKEN: Token = {
  name: 'REEF',
  address: REEF_ADDRESS,
  iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png',
  balance: BigNumber.from(0),
  decimals: 18,
  symbol: 'REEF',

}
export const reefTokenWithAmount = (): TokenWithAmount => toTokenAmount(
  REEF_TOKEN,
  {
    amount: '',
    index: -1,
    price: 0,
  },
);

export const getTokenPrice = (address: string, prices: TokenPrices): BN => new BN(prices[address]
  ? prices[address]
  : 0);

export const isNativeAddress = (toAddress: string) => {
  return toAddress.length === 48 && toAddress[0] === '5';
}
