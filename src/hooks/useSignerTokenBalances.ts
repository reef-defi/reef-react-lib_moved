import { useEffect, useState } from 'react';
import {
  DataProgress,
  DataWithProgress,
  isDataSet,
} from '../utils/dataWithProgress';
import { Token } from '../state/token';
import { Pool } from '../state';
import { calculateBalanceValue, calculateTokenPrice } from '../utils/tokenUtil';

export interface TokenWithPrice extends Token {
  price: DataWithProgress<number>;
  balanceValue: DataWithProgress<number>;
}

export const useSignerTokenBalances = (
  tokens: DataWithProgress<Token[]>,
  pools: Pool[],
  reefPrice: DataWithProgress<number>,
): DataWithProgress<TokenWithPrice[]> => {
  const [balances, setBalances] = useState<DataWithProgress<TokenWithPrice[]>>(
    DataProgress.LOADING,
  );
  useEffect(() => {
    if (!isDataSet(tokens)) {
      setBalances(tokens as DataWithProgress<TokenWithPrice[]>);
      return;
    }
    if (!pools.length || !isDataSet(reefPrice)) {
      setBalances(
        (tokens as Token[]).map((tkn) => {
          const stat = !isDataSet(reefPrice) ? reefPrice : DataProgress.LOADING;
          return { ...tkn, balanceValue: stat, price: stat } as TokenWithPrice;
        }),
      );
      return;
    }

    const bal = (tokens as Token[]).map((token: Token) => {
      const price = calculateTokenPrice(token, pools, reefPrice);
      const balanceValue = calculateBalanceValue({
        price,
        balance: token.balance,
      });
      return { ...token, price, balanceValue };
    });
    setBalances(bal);
  }, [tokens, pools, reefPrice]);
  return balances;
};
