import { Provider } from '@reef-defi/evm-provider';
import { web3Accounts, web3Enable } from '@reef-defi/extension-dapp';
import { InjectedExtension } from '@reef-defi/extension-inject/types';
import { useState } from 'react';
import { ReefSigner } from '../state';
import { useAsyncEffect } from './useAsyncEffect';
import { getExtensionSigners } from '../rpc';

export const useLoadSigners = (appDisplayName: string, provider?: Provider): [ReefSigner[], boolean, {code?: number, message:string}|undefined] => {
  const [signers, setSigners] = useState<ReefSigner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{message: string, code?:number}>();

  useAsyncEffect(async () => {
    if (!provider) {
      return;
    }

    try {
      setIsLoading(true);
      const extensions: InjectedExtension[] = await web3Enable(appDisplayName);
      if (extensions.length < 1) {
        setError({
          code: 1,
          message: 'Reef-App is used with Reef Wallet browser extension or some other substrate extension. Please install <a href="https://chrome.google.com/webstore/detail/reefjs-extension/mjgkpalnahacmhkikiommfiomhjipgjn" target="_blank">Polkadot-Extension</a> in your browser and refresh the page.',
        });
        return;
      }
      const web3accounts = await web3Accounts();
      if (web3accounts.length < 1) {
        setError({
          code: 2,
          message: 'Reef-App requires at least one account in browser extension. Please create or import account/s and refresh the page.',
        });
        return;
      }

      const sgnrs = await getExtensionSigners(extensions, provider);
      // TODO signers objects are large cause of provider object inside. Find a way to overcome this problem.
      setSigners(sgnrs);
    } catch (e) {
      console.log('Error when loading signers!', e);
      setError(e as {message: string});
    } finally {
      setIsLoading(false);
    }
  }, [provider]);
  return [signers, isLoading, error];
};
