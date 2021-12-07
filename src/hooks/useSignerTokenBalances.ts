import { useEffect, useState } from 'react';
import { BigNumber, utils } from 'ethers';
import { DataProgress, DataWithProgress, isDataSet } from '../utils/dataWithProgress';
import { Token } from '../state/token';
import { Pool } from '../state';
import { calculateTokenPrice } from '../utils/tokenPrice';

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
