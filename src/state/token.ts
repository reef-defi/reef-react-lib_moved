import { BigNumber } from 'ethers';
import { ensure } from '../utils/utils';
import { calculateAmount } from '../utils/math';

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
  address: '0x',
  balance: BigNumber.from('0'),
  decimals: -1,
  iconUrl: '',
  symbol: 'Select token',
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
    symbol: 'REEF',
  },
  {
    amount: '',
    index: -1,
    price: 0,
  },
);
