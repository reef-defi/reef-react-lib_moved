import { Provider } from '@reef-defi/evm-provider';
import { web3Accounts, web3Enable } from '@reef-defi/extension-dapp';
import { InjectedExtension } from '@reef-defi/extension-inject/types';
import { useEffect, useState } from 'react';
import { ReefSigner } from '../state';
import { useAsyncEffect } from './useAsyncEffect';
import { getExtensionSigners } from '../rpc';
import { setCurrentAddress } from '../appState/accountState';

function getBrowserExtensionUrl(): string | undefined {
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  if (isFirefox) {
    return 'https://addons.mozilla.org/en-US/firefox/addon/reef-js-extension/';
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  if (isChrome) {
    return 'https://chrome.google.com/webstore/detail/reefjs-extension/mjgkpalnahacmhkikiommfiomhjipgjn';
  }
  return undefined;
}

function getInstallExtensionMessage(): { message: string; url?: string } {
  const extensionUrl = getBrowserExtensionUrl();
  const installText = extensionUrl
    ? 'Please install Reef chain or some other Solidity browser extension and refresh the page.'
    : 'Please use Chrome or Firefox browser.';
  return {
    message: `App uses browser extension to get accounts and securely sign transactions. ${installText}`,
    url: extensionUrl,
  };
}

export const useLoadSigners = (
  appDisplayName: string,
  // if provider is not passed we need to pass signers and vice versa
  provider?: Provider,
  signers?: ReefSigner[],
): [
  ReefSigner[],
  boolean,
  { code?: number; message: string; url?: string } | undefined
] => {
  const [signersVal, setSignersVal] = useState<ReefSigner[]>(signers || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: number; url?: string }>();

  useEffect(() => {
    if (signers && signers.length) {
      setSignersVal(signers);
    }
  }, [signers]);

  useAsyncEffect(async () => {
    if (!provider) {
      return;
    }

    try {
      setIsLoading(true);
      const extensions: InjectedExtension[] = await web3Enable(appDisplayName);
      if (extensions.length < 1) {
        const installExtensionMessage = getInstallExtensionMessage();
        setError({
          code: 1,
          ...installExtensionMessage,
        });
        setIsLoading(false);
        return;
      }

      const web3accounts = await web3Accounts();
      if (web3accounts.length < 1) {
        setError({
          code: 2,
          message:
            'App requires at least one account in browser extension. Please create or import account/s and refresh the page.',
        });
        setIsLoading(false);
        return;
      }

      const sgnrs = await getExtensionSigners(extensions, provider);
      // TODO signers objects are large cause of provider object inside. Find a way to overcome this problem.
      setSignersVal(sgnrs);
    } catch (e) {
      console.log('Error when loading signers!', e);
      setError(e as { message: string });
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    if (!signersVal.length) {
      return;
    }

    const storedAddr = localStorage.getItem('selected_address_reef');
    if (storedAddr && signersVal.some((s) => storedAddr === s.address)) {
      setCurrentAddress(storedAddr);
      return;
    }
    setCurrentAddress(signersVal[0].address);
  }, [signersVal]);

  return [signersVal, isLoading, error];
};
