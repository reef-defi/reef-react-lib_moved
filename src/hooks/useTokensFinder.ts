import { useEffect, useState } from 'react';
import { rpc } from '..';
import { ReefSigner, TokenWithAmount, createEmptyTokenWithAmount, reefTokenWithAmount, Token } from '../state';

type State = 'Init' | 'Loading' | 'Success';

interface UseTokensFinder {
  tokens?: Token[]
  address1?: string;
  address2?: string;
  signer?: ReefSigner;
  currentAddress1: string;
  currentAddress2: string;
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
  address1, address2, currentAddress1, currentAddress2, tokens, signer, setToken1, setToken2
}: UseTokensFinder) => {
  const [state, setState] = useState<State>('Init');

  useEffect(() => {
    const reset = async (): Promise<void> => {
      if (!tokens || !signer || state !== 'Init') {
        return;
      }

      setState('Loading');
      if (address1 && address1 !== currentAddress1) {
        await findToken({
          signer,
          tokens,
          address: address1,
          defaultAmountValue: reefTokenWithAmount(),
        })
          .then(setToken1)
          .catch((_e) => console.error(`Token: ${address1} was not found`));
      }

      if (address2 && address2 !== currentAddress2) {
        await findToken({
          signer,
          tokens,
          address: address2,
          defaultAmountValue: createEmptyTokenWithAmount(),
        })
          .then(setToken2)
          .catch((_e) => console.error(`Token: ${address2} was not found`));
      }

      setState('Success');
    };
    reset();
  }, [address2, address1, tokens, signer]);
};
