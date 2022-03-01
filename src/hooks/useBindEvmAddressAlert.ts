import { useEffect } from 'react';
import { Provider } from '@reef-defi/evm-provider';
import { ReefSigner } from '../state';
import { bindEvmAddress } from '../utils/bindUtil';

export const useBindEvmAddressAlert = (
  currentSigner: ReefSigner | undefined,
  provider: Provider | undefined,
): void => {
  useEffect(() => {
    if (!currentSigner || !provider) {
      return;
    }
    bindEvmAddress(currentSigner, provider);
  }, [currentSigner, provider]);
};
