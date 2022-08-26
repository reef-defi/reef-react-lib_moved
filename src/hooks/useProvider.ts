import { useState } from 'react';
import { Provider } from '@reef-defi/evm-provider';
import { useAsyncEffect } from './useAsyncEffect';
import { initProvider } from '../utils/providerUtil';

export type UseProvider = [Provider | undefined, boolean, string, Function|undefined];

// should be used only once per url in app
export const useProvider = (providerUrl?: string | undefined): UseProvider => {
  const [provider, setProvider] = useState<Provider>();
  const [providerDestroyFn] = useState<Function>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useAsyncEffect(async () => {
    if (!providerUrl) {
      return;
    }
    Promise.resolve()
      .then(() => setError(''))
      .then(() => setIsLoading(true))
      .then(async () => await initProvider(providerUrl))
      .then((prov) => {
        if (provider && providerDestroyFn) {
          console.log('PROV DDDDD=', provider, providerDestroyFn);
          // providerDestroyFn();
        }
        setProvider(prov);
        // setProviderDestroyFn(prov.api.disconnect);
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [providerUrl]);

  return [provider, isLoading, error, providerDestroyFn];
};
