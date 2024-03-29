import { useEffect, useRef, useState } from 'react';
import { ApolloClient } from '@apollo/client';
import { Token, Pool } from '..';
import { ensureVoidRun, uniqueCombinations } from '../utils/utils';
import { loadPool } from './useLoadPool';

export const loadPools = async (
  tokens: Token[],
  userAddress: string,
  dexClient: ApolloClient<any>,
): Promise<Pool[]> => {
  const tokenCombinations = uniqueCombinations(tokens);
  const pools: Pool[] = [];
  for (let index = 0; index < tokenCombinations.length; index += 1) {
    try {
      const [token1, token2] = tokenCombinations[index];
      /* eslint-disable no-await-in-loop */
      const pool = await loadPool(token1, token2, userAddress, dexClient);
      /* eslint-disable no-await-in-loop */
      pools.push(pool);
    } catch (e) {}
  }
  return pools;
};

export const useLoadPools = (
  tokens: Token[],
  userAddress: string,
  dexClient?: ApolloClient<any>,
): [Pool[], boolean] => {
  const mounted = useRef(true);

  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ensureMounted = ensureVoidRun(mounted.current);

  useEffect(() => {
    if (!dexClient) return;
    const load = async (): Promise<void> => Promise.resolve()
      .then(() => {
        mounted.current = true;
      })
      .then(() => setIsLoading(true))
      .then(() => loadPools(tokens, userAddress, dexClient))
      .then((res) => ensureMounted(setPools, res))
      .catch(() => ensureMounted(setPools, []))
      .finally(() => ensureMounted(setIsLoading, false));

    load();
    return () => {
      mounted.current = false;
    };
  }, [tokens, dexClient, userAddress]);

  return [pools, isLoading];
};
