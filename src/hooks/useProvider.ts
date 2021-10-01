import { useState } from 'react';
import { Provider } from '@reef-defi/evm-provider';
import { WsProvider } from '@polkadot/api';
import { useAsyncEffect } from './useAsyncEffect';

type UseProvider = [Provider|undefined, boolean, string];

export const useProvider = (providerUrl: string): UseProvider => {
  const [provider, setProvider] = useState<Provider>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useAsyncEffect(async () => {
    Promise.resolve()
      .then(() => setError(''))
      .then(() => setIsLoading(true))
      .then(async () => {
        const newProvider = new Provider({
          provider: new WsProvider(providerUrl),
        });
        await newProvider.api.isReadyOrError;
        return newProvider;
      })
      .then(setProvider)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [providerUrl]);

  return [provider, isLoading, error];
};
