import { Token } from './token';

export interface Pool {
  token1: Token;
  token2: Token;
  decimals: number;
  reserve1: string;
  reserve2: string;
  totalSupply: string;
  poolAddress: string;
  userPoolBalance: string;
}

export interface BasicPoolInfo {
  address: string;
  token1: string;
  token2: string;
  symbol1: string;
  symbol2: string;
  decimals1: number;
  decimals2: number;
}

export interface LastPoolReserves extends BasicPoolInfo {
  reserved1: string;
  reserved2: string;
}

export interface PoolWithReserves extends LastPoolReserves {
  name1: string;
  name2: string;
  iconUrl1: string;
  iconUrl2: string;
}

export type TokenPrices = {[tokenAddress: string]: number};
