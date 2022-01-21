import { Provider } from '@reef-defi/evm-provider';
import { ReefSigner } from '../state';
import { handleErr, TxStatusHandler, TxStatusUpdate } from './transactionUtil';

export const bindEvmAddress = (signer: ReefSigner, provider: Provider, onTxChange?: TxStatusHandler, generateDefault?: boolean): string => {
  let txIdent = '';
  if (!provider) {
    return txIdent;
  }
  if (signer && !signer?.isEvmClaimed) {
    // eslint-disable-next-line no-restricted-globals,no-alert
    const isDefault = generateDefault || confirm('Use Reef chain with Ethereum VM capabilities.');
    if (isDefault) {
      txIdent = Math.random().toString(10);
      signer.signer.claimDefaultAccount().then(() => {
        if (!onTxChange) {
          alert(`Success, Ethereum VM address is ${signer.evmAddress}.`);
        } else {
          onTxChange({ txIdent, isInBlock: true, addresses: [signer.address] });
        }
      }).catch((err) => {
        const errHandler = onTxChange || ((txStat: TxStatusUpdate) => alert(txStat.error?.message));
        handleErr(err, txIdent, '', errHandler, signer);
      });
    } else {
      // TODO return claimEvmAccount(currentSigner, provider);
    }
  }
  return txIdent;
};
