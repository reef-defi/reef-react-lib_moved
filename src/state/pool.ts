import { ERC20ContractData, Token } from './token';

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

// TODO naming is a bit off
export interface BasicPoolInfo {
  address: string; // Pool address
  address1: string; // Token1 address
  address2: string; // Token1 address
  symbol1: string;
  symbol2: string;
  decimal1: number;
  decimal2: number;
}

export interface LastPoolReserves {
  reserved_1: number;
  reserved_2: number;
  token_1: string;
  token_2: string;
  token_data_1?: ERC20ContractData;
  token_data_2?: ERC20ContractData;
  address: string;
}

export type TokenPrices = {[tokenAddress: string]: number};
