import { Provider } from '@reef-defi/evm-provider';
import { ReefSigner } from '../state';
import { TxStatusHandler } from './transactionUtil';

export const alertEvmAddressBind = async (signer: ReefSigner, provider: Provider, onTxChange?: TxStatusHandler): Promise<void> => {
  if (!provider) {
    return Promise.resolve();
  }
  if (signer && !signer?.isEvmClaimed) {
    const txIdent = Math.random().toString(10);
    // eslint-disable-next-line no-restricted-globals,no-alert
    const isDefault = confirm('Create default Ethereum VM address for this account on Reef chain.');
    if (isDefault) {
      try {
        await signer.signer.claimDefaultAccount();
      } catch (err) {
        let message = '';
        if (err && (typeof err === 'string') && err.startsWith('1010')) {
          message = 'Add some Reef coins\nto this account\nand try again.';
        } else {
          message = `Transaction failed, err= ${err.toString()}`;
        }
        if (onTxChange) {
          onTxChange({ txIdent, error: message });
        } else {
          alert(message);
        }

        return Promise.resolve();
      }
      if (!onTxChange) {
        alert(`Created Ethereum VM address is ${signer.evmAddress}.\nNow you're ready to use full functionality of Reef chain.`);
      } else {
        onTxChange({ txIdent, isInBlock: true });
      }
    } else {
      // TODO return claimEvmAccount(currentSigner, provider);
    }
  }
  return Promise.resolve();
};
