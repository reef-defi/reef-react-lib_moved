import { Signer } from '@reef-defi/evm-provider';
import { BigNumber } from 'ethers';
import type { Signer as InjectedSigner } from '@polkadot/api/types';

export interface ReefSigner {
  name: string;
  signer: Signer;
  balance: BigNumber;
  address: string;
  evmAddress: string;
  isEvmClaimed: boolean;
  source: string;
  genesisHash?: string;
  sign: InjectedSigner;
}

export type Color = 'success' | 'danger' | 'warning';
export type Notify = 'success' | 'error' | 'warning' | 'info';
export type TokenSelector = 'token1' | 'token2';

// const baseFun = <T, >(value: string, type: T) => {};
export type NotifyFun = (message: string, type?: Notify) => void;
// type Test = BaseFun<Notify>;

type OnTokenSelect = (address: string, type?: TokenSelector) => void;

// Optional pick picks K keys from T and sets them to optional
// all other keys are discarded
export type OptionalPick<T, K extends keyof T> = {
  [P in keyof Pick<T, K>]?: T[P];
}

// Enables option to select desired keys to be optional
export type SelectPartial<T, K extends keyof T> = OptionalPick<T, K> | Pick<T, Exclude<keyof T, K>>;

export interface DefaultOptions {
  back: () => void;
  notify: NotifyFun;
  onTokenSelect: OnTokenSelect;
  updateTokenState: () => Promise<void>;
  onAddressChange: (address: string) => Promise<void>;
}

// export type PartialOptions = SelectedPartial<DefaultOptions, "back" | "notify">;
export type PartialOptions = Partial<DefaultOptions>;
export type AddressToNumber<T> = {
  [address: string]: T;
};

export const defaultOptions: DefaultOptions = {
  back: () => {},
  notify: () => {},
  onTokenSelect: () => {},
  onAddressChange: async () => {},
  updateTokenState: async () => {},
};

interface Timeframe {
  timeframe: string;
}
export interface BaseCandlestickData {
  close: number;
  high: number;
  low: number;
  open: number;
}
export interface BaseFeeData {
  fee1: number;
  fee2: number;
}
export interface BaseVolumeData {
  amount1: number;
  amount2: number;
}
export interface BaseReservedData {
  reserved1: number;
  reserved2: number;
}
export interface CandlestickData extends BaseCandlestickData, Timeframe { }
export interface FeeData extends BaseFeeData, Timeframe { }
export interface VolumeData extends BaseVolumeData, Timeframe { }
export interface ReservedData extends BaseReservedData, Timeframe { }

export interface PoolData {
  fee: FeeData[];
  volume: VolumeData[];
  reserves: ReservedData[];
  candlestick1: CandlestickData[];
  candlestick2: CandlestickData[];
}
