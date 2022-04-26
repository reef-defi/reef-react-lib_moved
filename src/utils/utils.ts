import { BigNumber, ethers } from 'ethers';

export const REEF_ADDRESS = '0x0000000000000000000000000000000001000000';
export const EMPTY_ADDRESS = '0x';

export interface ButtonStatus {
  text: string;
  isValid: boolean;
}

export const trim = (value: string, size = 19): string => (value.length < size
  ? value
  : `${value.slice(0, size - 5)}...${value.slice(value.length - 5)}`);

export const toAddressShortDisplay = (address: string): string => trim(address, 7);

export const ensure = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const toReefBalanceDisplay = (value?: BigNumber): string => {
  if (value && value.gt(0)) {
    const stringValue = ethers.utils.formatEther(value);
    const delimiterIndex = stringValue.indexOf('.');
    return `${stringValue.substring(0, delimiterIndex)} REEF`;
  }
  return '- REEF';
};

export const uniqueCombinations = <T>(array: T[]): [T, T][] => {
  const result: [T, T][] = [];
  for (let i = 0; i < array.length; i += 1) {
    for (let j = i + 1; j < array.length; j += 1) {
      result.push([array[i], array[j]]);
    }
  }
  return result;
};

export const errorStatus = (text: string): ButtonStatus => ({
  isValid: false,
  text,
});

export const ensureVoidRun = (canRun: boolean) => <I>(fun: (obj: I) => void, obj: I): void => {
  if (canRun) {
    fun(obj);
  }
};
