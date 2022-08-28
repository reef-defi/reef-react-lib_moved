import { BigNumber } from 'ethers';
import { BigNumber as BN } from 'bignumber.js';
import { parseEther } from 'ethers/lib/utils';
import {
  EMPTY_ADDRESS,
  ensure,
  MIN_EVM_TX_BALANCE,
  MIN_NATIVE_TX_BALANCE,
  REEF_ADDRESS,
  toReefBalanceDisplay,
} from '../utils/utils';
import { assertAmount, calculateAmount } from '../utils/math';
import { TokenPrices } from './pool';

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

export const checkMinExistentialReefAmount = (token: TokenWithAmount, reefBalance: BigNumber): {valid: boolean, message?: string, maxTransfer: BigNumber} => {
  const nativeReefTransfer = isNativeTransfer(token);
  const FIXED_TX_FEE = nativeReefTransfer ? 2 : 3;
  const minAmountBesidesTx = (nativeReefTransfer ? MIN_NATIVE_TX_BALANCE : MIN_EVM_TX_BALANCE);
  const reservedTxMin = calculateAmount({ decimals: REEF_TOKEN.decimals, amount: (minAmountBesidesTx + FIXED_TX_FEE).toString() });
  const transferAmt = BigNumber.from(parseEther(assertAmount(token.amount)));
  const requiredReefMin = nativeReefTransfer ? BigNumber.from(reservedTxMin).add(transferAmt) : BigNumber.from(reservedTxMin);
  const maxTransfer = reefBalance.sub(BigNumber.from(reservedTxMin));
  const valid = reefBalance.gte(requiredReefMin);
  let message = '';
  if (!valid) {
    message = `${toReefBalanceDisplay(BigNumber.from(reservedTxMin))} balance needed to call EVM transaction. Token transfer fee ~2.5 REEF.`;

    if (nativeReefTransfer) {
      const maxTransfer = reefBalance.sub(BigNumber.from(reservedTxMin));
      message = `Maximum transfer amount is ~${toReefBalanceDisplay(maxTransfer)} to allow for fees.`;
    }
  }
  return { valid, message, maxTransfer };
};

export const ensureTokenAmount = (token: TokenWithAmount): void => ensure(
  BigNumber.from(calculateAmount(token)).lte(token.balance),
  `Insufficient ${token.name} balance`,
);

export const ensureExistentialReefAmount = (token: TokenWithAmount, reefBalance: BigNumber): void => {
  ensure(checkMinExistentialReefAmount(token, reefBalance).valid, 'Insufficient REEF balance.');
};

export const REEF_TOKEN: Token = {
  name: 'REEF',
  address: REEF_ADDRESS,
  iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png',
  balance: BigNumber.from(0),
  decimals: 18,
  symbol: 'REEF',

};
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

export const isNativeAddress = (toAddress: string) => toAddress.length === 48 && toAddress[0] === '5';
