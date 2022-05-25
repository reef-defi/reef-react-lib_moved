import { useEffect } from 'react';
import { AddressToNumber, TokenWithAmount } from '../state';

interface UpdateTokensPriceHook {
  token1: TokenWithAmount;
  token2: TokenWithAmount;
  tokenPrices: AddressToNumber<number>;
  setToken1: (token: TokenWithAmount) => void;
  setToken2: (token: TokenWithAmount) => void;
}

export const useUpdateTokensPrice = ({
  token1,
  token2,
  setToken1,
  setToken2,
  tokenPrices,
}: UpdateTokensPriceHook): void => {
  useEffect(() => {
    setToken1({ ...token1, price: tokenPrices[token1.address] || 0 });
    setToken2({ ...token2, price: tokenPrices[token2.address] || 0 });
  }, [token1.address, token2.address, tokenPrices]);
};
