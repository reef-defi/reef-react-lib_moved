import { Provider } from '@reef-defi/evm-provider';
import { WsProvider } from '@polkadot/api';

export async function initProvider(providerUrl: string) {
  const newProvider = new Provider({
    provider: new WsProvider(providerUrl),
  });
  try {
    await newProvider.api.isReadyOrError;
  } catch (e) {
    console.log('Provider isReadyOrError ERROR=', e);
    throw e;
  }
  return newProvider;
}

export async function disconnectProvider(provider: Provider) {
  await provider.api.disconnect();
}
