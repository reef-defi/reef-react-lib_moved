export enum UpdateDataType {
  ACCOUNT_NATIVE_BALANCE,
  ACCOUNT_TOKENS,
  ACCOUNT_EVM_BINDING,
}

export interface UpdateAction {
  address?: string;
  type: UpdateDataType;
}

export interface UpdateDataCtx<T> {
  data?: T;
  updateActions: UpdateAction[];
  ctx?: any;
}