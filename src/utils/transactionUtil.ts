import { Provider } from '@reef-defi/evm-provider';
import { BigNumber } from 'ethers';
import { handleTxResponse } from '@reef-defi/evm-provider/utils';
import { ReefSigner } from '../state';

export const TX_TYPE_EVM = 'TX_TYPE_EVM';

export type TxStatusHandler = (status: TxStatusUpdate)=>void;

export interface TxStatusUpdate {
  txIdent: string;
  txHash?: string;
  error?: string;
  isInBlock?: boolean;
  isComplete?: boolean;
  type?: string;
  url?: string;
}

export const handleErr = (e: {message: string}|string, txIdent:string, txHash: string, txHandler: TxStatusHandler): void => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let reason = e.message || e;
  if (reason && (reason.indexOf('-32603: execution revert: 0x') > -1 || reason?.indexOf('InsufficientBalance') > -1)) {
    reason = 'You must allow minimum 60 REEF on account for Ethereum VM transaction even if transaction fees will be much lower.';
  }
  if (reason && (reason?.startsWith('1010'))) {
    reason = 'Balance too low.';
  }
  txHandler({
    txIdent, txHash, error: reason,
  });
};

export const sendToNativeAddress = async (provider: Provider, signer: ReefSigner, toAmt: BigNumber, to: string, txHandler: TxStatusHandler): Promise<string> => {
  const transfer = provider.api.tx.balances.transfer(to, toAmt.toString());
  const substrateAddress = await signer.signer.getSubstrateAddress();
  const txIdent = Math.random().toString(10);
  transfer.signAndSend(substrateAddress, { signer: signer.signer.signingKey },
    (res) => handleTxResponse(res, provider.api).then(
      (txRes: any): void => {
        const txHash = transfer.hash.toHex();
        txHandler({
          txIdent, txHash, isInBlock: txRes.result.status.isInBlock, isComplete: txRes.result.status.isFinalized,
        });
      },
    ).catch((rej: any) => {
      // finalized error is ignored
      if (rej.result.status.isInBlock) {
        const txHash = transfer.hash.toHex();
        handleErr(rej.message, txIdent, txHash, txHandler);
      }
    })).catch((e) => {
    console.log('sendToNativeAddress err=', e);
    handleErr(e, txIdent, '', txHandler);
  });
  return Promise.resolve(txIdent);
};
