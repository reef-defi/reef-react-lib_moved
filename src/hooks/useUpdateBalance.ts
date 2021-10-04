import { useEffect } from 'react';
import { TokenWithAmount } from '..';
import { Token } from '../state';

export const useUpdateBalance = (token: TokenWithAmount, tokens: Token[], setToken: (value: TokenWithAmount) => void): void => {
  useEffect(() => {
    tokens
      .forEach((storeToken) => storeToken.address === token.address
      && setToken({ ...token, ...storeToken }));
    // TODO replace dependencies with reloadTokensToggle (boolean)
  }, [tokens]);
};
