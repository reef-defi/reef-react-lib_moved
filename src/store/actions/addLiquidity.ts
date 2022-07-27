import { Settings, Token } from '../../state';
import { SET_NEW_POOL_SUPPLY } from '../actionTypes';
import {
  ClearTokenAmounts, SetCompleteStatus, SetLoading, SetPercentage, SetPool, SetSettings, SetStatus, SetToken1, SetToken1Amount, SetToken2, SetToken2Amount, SetValidity,
} from './defaultActions';

type SetNewPoolSupply = {
  type: typeof SET_NEW_POOL_SUPPLY;
  supply: string;
}

export const SetNewPoolSupplyAction = (supply: string): SetNewPoolSupply => ({
  supply,
  type: SET_NEW_POOL_SUPPLY,
});

export type AddLiquidityActions =
  | SetPool
  | SetStatus
  | SetLoading
  | SetToken1
  | SetToken2
  | SetSettings
  | SetPercentage
  | SetToken1Amount
  | SetToken2Amount
  | SetNewPoolSupply
  | SetCompleteStatus
  | ClearTokenAmounts
  | SetValidity;

export interface AddLiquidityComponentActions {
  back: () => void;
  onAddLiquidity: () => Promise<void>;
  selectToken1: (token: Token) => void;
  selectToken2: (token: Token) => void;
  setPercentage: (amount: number) => void;
  setSettings: (settings: Settings) => void;
  setToken1Amount: (amount: string) => void;
  setToken2Amount: (amount: string) => void;
  onAddressChange: (address: string) => Promise<void>;
}
