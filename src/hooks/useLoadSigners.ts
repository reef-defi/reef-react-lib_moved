import { Provider } from '@reef-defi/evm-provider';
import { web3Accounts, web3Enable } from '@reef-defi/extension-dapp';
import { InjectedExtension } from '@reef-defi/extension-inject/types';
import { useState } from 'react';
import { ReefSigner } from '../state';
import { useAsyncEffect } from './useAsyncEffect';
import { getExtensionSigners } from '../rpc';

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
  provider?: Provider,
): [
  ReefSigner[],
  boolean,
  { code?: number; message: string; url?: string } | undefined
] => {
  const [signers, setSigners] = useState<ReefSigner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: number; url?: string }>();

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
        return;
      }
      const web3accounts = await web3Accounts();
      if (web3accounts.length < 1) {
        setError({
          code: 2,
          message:
            'App requires at least one account in browser extension. Please create or import account/s and refresh the page.',
        });
        return;
      }

      const sgnrs = await getExtensionSigners(extensions, provider);
      // TODO signers objects are large cause of provider object inside. Find a way to overcome this problem.
      setSigners(sgnrs);
    } catch (e) {
      console.log('Error when loading signers!', e);
      setError(e as { message: string });
    } finally {
      setIsLoading(false);
    }
  }, [provider]);
  return [signers, isLoading, error];
};
