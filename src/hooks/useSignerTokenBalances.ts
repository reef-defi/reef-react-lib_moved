import { useEffect, useState } from 'react';
import { BigNumber, utils } from 'ethers';
import { isDataSet, DataProgress, DataWithProgress } from '../utils/dataWithProgress';
import { reefTokenWithAmount, Token } from '../state/token';
import { Pool } from '../state';

const { parseUnits, formatEther } = utils;

export interface TokenWithPrice extends Token {
  price: DataWithProgress<number>;
  balanceValue: DataWithProgress<number>;
}

const calculateBalanceValue = (price: DataWithProgress<number>, token: Token): DataWithProgress<number> => {
  // eslint-disable-next-line no-prototype-builtins
  if (!isDataSet(price)) {
    return price;
  }
  const priceBN = BigNumber.from(parseUnits(price.toString()));
  const balanceFixed = parseInt(formatEther(token.balance.toString()), 10);
  return parseFloat(formatEther(priceBN.mul(BigNumber.from(balanceFixed)).toString()));
};

const getReefTokenPoolReserves = (reefTokenPool: Pool, reefAddress: string): {reefReserve:number, tokenReserve: number} => {
  let reefReserve: number;
  let tokenReserve: number;
  if (reefTokenPool.token1.address.toLowerCase() === reefAddress.toLowerCase()) {
    reefReserve = parseInt(reefTokenPool.reserve1, 10);
    tokenReserve = parseInt(reefTokenPool.reserve2, 10);
  } else {
    reefReserve = parseInt(reefTokenPool.reserve2, 10);
    tokenReserve = parseInt(reefTokenPool.reserve1, 10);
  }
  return { reefReserve, tokenReserve };
};

const findReefTokenPool = (pools: Pool[], reefAddress: string, token: Token): Pool | undefined => pools.find((pool) => (pool.token1.address.toLowerCase() === reefAddress.toLowerCase() && pool.token2.address.toLowerCase() === token.address.toLowerCase()) || (pool.token2.address.toLowerCase() === reefAddress.toLowerCase() && pool.token1.address.toLowerCase() === token.address.toLowerCase()));

const calculateTokenPrice = (token: Token, pools: Pool[], reefPrice: DataWithProgress<number>): DataWithProgress<number> => {
  if (!isDataSet(reefPrice)) {
    return reefPrice;
  }
  const { address: reefAddress } = reefTokenWithAmount();
  let ratio: number;
  if (token.address.toLowerCase() !== reefAddress.toLowerCase()) {
    const reefTokenPool = findReefTokenPool(pools, reefAddress, token);
    if (reefTokenPool) {
      const { reefReserve, tokenReserve } = getReefTokenPoolReserves(reefTokenPool, reefAddress);
      ratio = reefReserve / tokenReserve;
      return ratio * (reefPrice as number);
    }
    return DataProgress.NO_DATA;
  }
  return reefPrice || DataProgress.NO_DATA;
};

export const useSignerTokenBalances = (tokens: DataWithProgress<Token[]>, pools: Pool[], reefPrice: DataWithProgress<number>): DataWithProgress<TokenWithPrice[]> => {
  const [balances, setBalances] = useState<DataWithProgress<TokenWithPrice[]>>(DataProgress.LOADING);
  useEffect(() => {
    if (!isDataSet(tokens)) {
      setBalances(tokens as DataWithProgress<TokenWithPrice[]>);
      return;
    }
    if (!pools.length || !isDataSet(reefPrice)) {
      setBalances((tokens as Token[]).map((tkn) => {
        const stat = !isDataSet(reefPrice) ? reefPrice : DataProgress.LOADING;
        return { ...tkn, balanceValue: stat, price: stat } as TokenWithPrice;
      }));
      return;
    }

    const bal = (tokens as Token[]).map((token: Token) => {
      const price = calculateTokenPrice(token, pools, reefPrice);
      const balanceValue = calculateBalanceValue(price, token);
      return { ...token, price, balanceValue };
    });
    setBalances(bal);
  }, [tokens, pools, reefPrice]);
  return balances;
};
