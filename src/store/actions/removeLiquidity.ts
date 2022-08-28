import { Settings } from '../../state';
import {
  SetCompleteStatus, SetLoading, SetPercentage, SetPool, SetSettings, SetStatus, SetToken1, SetToken2, SetValidity,
} from './defaultActions';

export type RemoveLiquidityActions =
  | SetLoading
  | SetPool
  | SetToken1
  | SetToken2
  | SetStatus
  | SetValidity
  | SetCompleteStatus
  | SetPercentage
  | SetSettings;

export interface RemoveLiquidityComponentActions {
  back: () => void;
  onRemoveLiquidity: () => Promise<void>;
  setPercentage: (percentage: number) => void;
  setSettings: (settings: Settings) => void;
}
