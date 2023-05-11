import { Token } from './token';

export interface Pool {
  token1: Token;
  token2: Token;
  decimals: number;
  // TODO transform reserve1, reserve2, userPoolBalance and minimumLiquidity to BigNumber
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
  decimal1: number;
  decimal2: number;
}

export interface LastPoolReserves extends BasicPoolInfo {
  reserved1: string;
  reserved2: string;
}

export interface PoolWithReserves extends LastPoolReserves {
  name1: string;
  name2: string;
  icon1: string;
  icon2: string;
}

export type TokenPrices = {[tokenAddress: string]: number};
