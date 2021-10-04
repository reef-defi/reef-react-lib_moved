import { Signer } from '@reef-defi/evm-provider';
import { useEffect, useRef, useState } from 'react';
import { retrieveReefCoingeckoPrice } from '../api';
import { loadPool } from '../rpc';
import { Pool, Token, TokenWithAmount } from '../state';
import { ensureVoidRun } from '../utils';
import { poolRatio } from '../utils/math';

interface UpdateTokensPriceHook {
  pool?: Pool;
  signer?: Signer;
  tokens: Token[];
  factoryAddress: string;
  token1: TokenWithAmount;
  token2: TokenWithAmount;
  setToken1: (token: TokenWithAmount) => void;
  setToken2: (token: TokenWithAmount) => void;
}

export const useUpdateTokensPrice = ({
  pool, token1, token2, tokens, signer, factoryAddress, setToken1, setToken2,
}: UpdateTokensPriceHook): boolean => {
  const mounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const ensureMount = ensureVoidRun(mounted.current);

  const updateTokens = (tokenPrice1: number, tokenPrice2: number): void => {
    ensureMount(setToken1, { ...token1, price: tokenPrice1 });
    ensureMount(setToken2, { ...token2, price: tokenPrice2 });
  };

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!pool || !signer) { return; }
      try {
        mounted.current = true;
        setIsLoading(true);
        const reefPrice = await retrieveReefCoingeckoPrice();
        const baseRatio = poolRatio(pool);

        if (token1.name === 'REEF') {
          updateTokens(reefPrice, reefPrice / baseRatio);
        } else if (token2.name === 'REEF') {
          updateTokens(reefPrice, reefPrice * baseRatio);
        } else {
          // const sellPool = await poolContract(tokens[0], token1, signer, settings);
          const sellPool = await loadPool(tokens[0], token1, signer, factoryAddress);
          const sellRatio = poolRatio(sellPool);
          updateTokens(reefPrice / sellRatio, reefPrice / sellRatio * baseRatio);
        }
      } catch (error) {
        console.error(error);
        updateTokens(0, 0);
      } finally {
        ensureMount(setIsLoading, false);
      }
    };
    load();
  }, [pool]);

  return isLoading;
};
