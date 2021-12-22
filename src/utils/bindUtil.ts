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
    const isDefault = generateDefault || confirm('Create default Ethereum VM address for this account on Reef chain.');
    if (isDefault) {
      txIdent = Math.random().toString(10);
      signer.signer.claimDefaultAccount().then((res) => {
        if (!onTxChange) {
          alert(`Created Ethereum VM address is ${signer.evmAddress}.\nNow you're ready to use full functionality of Reef chain.`);
        } else {
          console.log('tx RES =', res);
          onTxChange({ txIdent, isInBlock: true, address: signer.address });
        }
      }).catch((err) => {
        const errHandler = onTxChange || ((txStat: TxStatusUpdate) => alert(txStat.error?.message));
        handleErr(err, txIdent, '', errHandler);
      });
    } else {
      // TODO return claimEvmAccount(currentSigner, provider);
    }
  }
  return txIdent;
};
