import { Settings } from '../../state';
import { SET_PERCENTAGE } from '../actionTypes';
import {
  SetCompleteStatus, SetLoading, SetPool, SetSettings, SetStatus, SetToken1, SetToken2, SetValidity,
} from './defaultActions';

type SetPercentage = {
  type: typeof SET_PERCENTAGE;
  percentage: number;
}

export const setPercentageAction = (percentage: number): SetPercentage => ({
  percentage,
  type: SET_PERCENTAGE,
});

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
