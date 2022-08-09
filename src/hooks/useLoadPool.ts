import { Signer } from '@reef-defi/evm-provider';
import { useState, useEffect } from 'react';
import { Pool, Token } from '..';
import { loadPool } from '../rpc/pools';

type LoadingPool = Pool | undefined;

export const useLoadPool = (
  token1: Token,
  token2: Token,
  factoryAddress: string,
  signer?: Signer,
  disable?: boolean,
): [LoadingPool, boolean] => {
  const [pool, setPool] = useState<Pool>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!token1.address || !token2.address || !signer || disable) {
        return;
      }
      Promise.resolve()
        .then(() => setIsLoading(true))
        .then(() => loadPool(token1, token2, signer, factoryAddress))
        .then(setPool)
        .catch(() => setPool(undefined))
        .finally(() => setIsLoading(false));
    };

    load();
  }, [token1.address, token2.address, token1.balance, token2.balance]);

  return [pool, isLoading];
};
