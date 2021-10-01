import { useEffect, useRef, useState } from 'react';
import { Signer } from '@reef-defi/evm-provider';
import { Token, Pool, Network } from '..';
import { loadPools } from '../rpc/pools';
import { ensureVoidRun } from '../utils/utils';

export const useLoadPools = (tokens: Token[], signer: Signer, settings: Network): [Pool[], boolean] => {
  const mounted = useRef(true);

  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ensureMounted = ensureVoidRun(mounted.current);

  useEffect(() => {
    const load = async (): Promise<void> => Promise.resolve()
      .then(() => { mounted.current = true; })
      .then(() => setIsLoading(true))
      .then(() => loadPools(tokens, signer, settings))
      .then((res) => ensureMounted(setPools, res))
      .catch(() => ensureMounted(setPools, []))
      .finally(() => ensureMounted(setIsLoading, false));

    load();
    return () => {
      mounted.current = false;
    };
  }, [tokens]);

  return [pools, isLoading];
};
