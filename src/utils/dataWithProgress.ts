export enum DataProgress {
  LOADING = 'DataProgress_LOADING',
  NO_DATA = 'DataProgress_NO_DATA',
}

export type DataWithProgress<T> = T | DataProgress;

// eslint-disable-next-line no-prototype-builtins
export const isDataSet = (dataOrProgress: DataWithProgress<any>): boolean => !Object.keys(DataProgress).some((k:string) => (DataProgress as any)[k] === dataOrProgress);
export const getData = <T>(
  dataOrProgress: DataWithProgress<T>,
): T | undefined => (isDataSet(dataOrProgress) ? (dataOrProgress as T) : undefined);
export const getProgress = (
  dataOrProgress: DataWithProgress<any>,
): DataProgress | undefined => (!isDataSet(dataOrProgress) ? (dataOrProgress as DataProgress) : undefined);
