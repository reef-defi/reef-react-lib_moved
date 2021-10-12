import { Signer } from '@reef-defi/evm-provider';

export interface ReefSigner {
  name: string;
  signer: Signer;
  balance: string;
  address: string;
  evmAddress: string;
  isEvmClaimed: boolean;
}

export type Color = 'success' | 'danger' | 'warning';
export type Notify = 'success' | 'error' | 'warning';
