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
  minimumLiquidity: string;
}
