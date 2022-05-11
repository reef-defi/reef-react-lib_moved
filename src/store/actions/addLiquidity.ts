import { SET_NEW_POOL_SUPPLY } from "../actionTypes";
import { ClearTokenAmounts, SetCompleteStatus, SetLoading, SetPool, SetStatus, SetToken1, SetToken1Amount, SetToken2, SetToken2Amount, SetValidity } from "./defaultActions";

type SetNewPoolSupply = {
  type: typeof SET_NEW_POOL_SUPPLY;
  supply: string;
}

export const SetNewPoolSupplyAction = (supply: string): SetNewPoolSupply => ({
  supply,
  type: SET_NEW_POOL_SUPPLY,
})

export type AddLiquidityActions =
  | SetPool
  | SetStatus
  | SetLoading
  | SetToken1
  | SetToken2
  | SetToken1Amount
  | SetToken2Amount
  | SetNewPoolSupply
  | SetCompleteStatus
  | ClearTokenAmounts
  | SetValidity;
