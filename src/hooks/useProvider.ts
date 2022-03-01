import { useState } from 'react';
import { Provider } from '@reef-defi/evm-provider';
import { WsProvider } from '@polkadot/api';
import { useAsyncEffect } from './useAsyncEffect';

export type UseProvider = [Provider | undefined, boolean, string];
// should be used only once per url in app
export const useProvider = (providerUrl?: string | undefined): UseProvider => {
  const [provider, setProvider] = useState<Provider>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useAsyncEffect(async () => {
    if (!providerUrl) {
      return;
    }
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
