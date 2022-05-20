import { useEffect, useState } from 'react';
import { rpc } from '..';
import {
  createEmptyTokenWithAmount, ReefSigner, reefTokenWithAmount, Token, TokenWithAmount,
} from '../state';

interface UseTokensFinder {
  tokens?: Token[]
  address1?: string;
  address2?: string;
  signer?: ReefSigner;
  setToken1: (token: TokenWithAmount) => void;
  setToken2: (token: TokenWithAmount) => void;
}

// type UseTokensFinderOutput = [TokenWithAmount, TokenWithAmount, State];

interface FindToken {
  tokens: Token[];
  address?: string;
  signer?: ReefSigner;
  defaultAmountValue: TokenWithAmount;
}

// if address or token list or token in list or on rpc does not exist return default values
// else combine data with default amount values
// function also guarenties that the found token is not empty
const findToken = async ({
  signer, address, tokens: tokensCombined, defaultAmountValue = createEmptyTokenWithAmount(),
}: FindToken): Promise<TokenWithAmount> => {
  if (!address || !signer || !tokensCombined) {
    return defaultAmountValue;
  }

  const existingToken = tokensCombined
    .find(((token) => token.address.toLowerCase() === address.toLowerCase()));

  if (existingToken) {
    return { ...defaultAmountValue, ...existingToken, isEmpty: false };
  }

  const promisedToken = await rpc.loadToken(address, signer.signer);
  if (promisedToken) {
    return { ...defaultAmountValue, ...promisedToken, isEmpty: false };
  }

  return defaultAmountValue;
};

export const useTokensFinder = ({
  address1, address2, tokens, signer, setToken1, setToken2,
}: UseTokensFinder): void => {
  const [currentAddress1, setCurrentAddress1] = useState<string>();
  const [currentAddress2, setCurrentAddress2] = useState<string>();

  useEffect(() => {
    const reset = async (): Promise<void> => {
      if (!tokens || tokens.length === 0 || !signer) {
        return;
      }

      if (currentAddress1 !== address1) {
        await findToken({
          signer,
          tokens,
          address: address1,
          defaultAmountValue: reefTokenWithAmount(),
        })
          .then(setToken1)
          .then(() => setCurrentAddress1(address1))
          .catch((_e) => console.error(`Token: ${address1} was not found`));
      }
      if (currentAddress2 !== address2) {
        await findToken({
          signer,
          tokens,
          address: address2,
          defaultAmountValue: createEmptyTokenWithAmount(),
        })
          .then(setToken2)
          .then(() => setCurrentAddress2(address2))
          .catch((_e) => console.error(`Token: ${address2} was not found`));
      }
    };
    reset();
  }, [address2, address1, tokens, signer]);
};
