import { useEffect } from 'react';
import {
  AddressToNumber, createEmptyTokenWithAmount, Token, TokenWithAmount,
} from '../state';

// if address or token list or token in list or on rpc does not exist return default values
// else combine data with default amount values
// function also guaranties that the found token is not empty
export const findToken = (address: string, tokens: Token[], defaultAmountValue = createEmptyTokenWithAmount()): TokenWithAmount => {
  if (!address || !tokens) {
    return defaultAmountValue;
  }

  const existingToken = tokens
    .find(((token) => token.address.toLowerCase() === address.toLowerCase()));

  if (existingToken) {
    return { ...defaultAmountValue, ...existingToken, isEmpty: false };
  }
  return defaultAmountValue;
};

export const useKeepTokenUpdated = (
  address: string,
  token: TokenWithAmount,
  tokens: Token[],
  tokenPrices: AddressToNumber<number>,
  setToken: (token: TokenWithAmount) => void,
): void => {
  useEffect(() => {
    const foundToken = findToken(address, tokens);
    const price = tokenPrices[address];
    setToken({ ...foundToken, amount: token.amount, price });
  }, [address, tokens, tokenPrices[address]]);
};
