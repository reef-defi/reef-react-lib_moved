import { Signer } from '@reef-defi/evm-provider';
import { BigNumber } from 'ethers';

export interface ReefSigner {
  name: string;
  signer: Signer;
  balance: BigNumber;
  address: string;
  evmAddress: string;
  isEvmClaimed: boolean;
  source: string;
}

export type Color = 'success' | 'danger' | 'warning';
export type Notify = 'success' | 'error' | 'warning';
