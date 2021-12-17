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
