import { useEffect } from 'react';
import { Provider } from '@reef-defi/evm-provider';
import { ReefSigner } from '../state';

export const useBindEvmAddressAlert = (currentSigner: ReefSigner|undefined, provider: Provider|undefined): void => {
  useEffect(() => {
    if (!currentSigner || !provider) {
      return;
    }
    async function bindEvmAddress(): Promise<void> {
      if (!provider) {
        return Promise.resolve();
      }
      if (currentSigner && !currentSigner?.isEvmClaimed) {
        // eslint-disable-next-line no-restricted-globals,no-alert
        const isDefault = confirm('Create default Ethereum VM address for this account on Reef chain.');
        if (isDefault) {
          try {
            await currentSigner.signer.claimDefaultAccount();
          } catch (err: any) {
            if (err && (typeof err === 'string') && err.startsWith('1010')) {
              alert('Add some Reef coins\nto this account\nand try again.');
            } else {
              alert(`Transaction failed, err= ${err.toString()}`);
            }
            return Promise.resolve();
          }
          alert(`Created Ethereum VM address is ${currentSigner.evmAddress}.\nNow you're ready to use full functionality of Reef chain.`);
        } else {
          // TODO return claimEvmAccount(currentSigner, provider);
        }
      }
      return Promise.resolve();
    }
    bindEvmAddress();
  }, [currentSigner, provider]);
};
