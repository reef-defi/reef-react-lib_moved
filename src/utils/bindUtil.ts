import { Provider } from '@reef-defi/evm-provider';
import { decodeAddress } from '@polkadot/util-crypto';
import { ReefSigner } from '../state';
import { handleErr, TxStatusHandler, TxStatusUpdate } from './transactionUtil';
import { ethers } from 'ethers';
import { Buffer } from 'buffer';

export const bindEvmAddress = (
  signer: ReefSigner,
  provider: Provider,
  onTxChange?: TxStatusHandler,
): string => {
  if (!provider || !signer || signer?.isEvmClaimed) {
    return '';
  }

  const txIdent = Math.random().toString(10);
  signer.signer
    .claimDefaultAccount()
    .then(() => {
      if (!onTxChange) {
        alert(`Success, Ethereum VM address is ${signer.evmAddress}. Use this address ONLY on Reef chain.`);
      } else {
        onTxChange({
          txIdent,
          isInBlock: true,
          addresses: [signer.address],
        });
      }
    })
    .catch((err) => {
      const errHandler = onTxChange
        || ((txStat: TxStatusUpdate) => alert(txStat.error?.message));
      handleErr(err, txIdent, '', errHandler, signer);
    });
  return txIdent;
};

export const bindCustomEvmAddress = (
  signer: ReefSigner,
  provider: Provider,
  evmAddress: string,
  signature: string,
  onTxChange?: TxStatusHandler,
): string => {
  if (!provider || !signer || signer?.isEvmClaimed || !evmAddress || !signature) {
    return '';
  }

  const txIdent = Math.random().toString(10);
  provider.api.tx.evmAccounts.claimAccount(evmAddress, signature)
    .signAndSend(signer.signer._substrateAddress)
    .then(() => {
      if (!onTxChange) {
        alert(`Success, message signed for address ${evmAddress}.`);
      } else {
        onTxChange({
          txIdent,
          isInBlock: true,
          addresses: [signer.address],
        });
      }
    })
    .catch((err) => {
      const errHandler = onTxChange
        || ((txStat: TxStatusUpdate) => alert(txStat.error?.message));
      handleErr(err, txIdent, '', errHandler, signer);
    });
  return txIdent;
};

export const signBindEvmAddress = async (
  signer: ReefSigner
): Promise<{evmAddress?: string, signature?: string, error?: string}> => {
  const publicKey = decodeAddress(signer.signer._substrateAddress);
  const message = 'reef evm:' + Buffer.from(publicKey).toString('hex');

  // @ts-ignore
  const ethereumProvider = window.ethereum;
  if (typeof ethereumProvider === 'undefined') return { error: 'No EVM wallet found.' }

  try {
    const provider = new ethers.providers.Web3Provider(ethereumProvider);
    const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' })
      .catch((err: any) => {
        if (err.code === 4001) {
          return { error: 'Please connect to your EVM wallet.' };
        } else {
          console.error(err);
          return { error: 'Failed to connect to EVM wallet.' };
        }
      });
    const account = accounts[0];
    const signer = provider.getSigner();
    const signature = await signer.signMessage(message);
    return { evmAddress: account, signature };
  } catch (err) {
    console.error(err);
    return { error: "Failed to sign message" };
  }
};