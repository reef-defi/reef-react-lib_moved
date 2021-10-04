import { Signer } from '@reef-defi/evm-provider';
import { useRef, useState, useEffect } from 'react';
import { Pool, Token } from '..';
import { loadPool } from '../rpc/pools';
import { ensureVoidRun } from '../utils/utils';

type LoadingPool = Pool | undefined;

export const useLoadPool = (token1: Token, token2: Token, factoryAddress: string, signer?: Signer): [LoadingPool, boolean] => {
  const mounted = useRef(true);

  const [pool, setPool] = useState<Pool>();
  const [isLoading, setIsLoading] = useState(false);

  const ensureMounted = ensureVoidRun(mounted.current);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!token1.address || !token2.address || !signer) { return; }
      try {
        mounted.current = true;
        setIsLoading(true);
        const foundPool = await loadPool(token1, token2, signer, factoryAddress);
        ensureMounted(setPool, foundPool);
      } catch (e) {
        setPool(undefined);
      } finally {
        ensureMounted(setIsLoading, false);
      }
    };

    load();

    return (): void => {
      mounted.current = false;
    };
  }, [token1.address, token2.address, token1.balance, token2.balance]);

  return [pool, isLoading];
};
