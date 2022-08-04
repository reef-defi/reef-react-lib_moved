import { BigNumber, ethers } from 'ethers';
import { DEFAULT_TOKEN_ICONS } from '../components/common/Icons';
import { reefTokenWithAmount } from '../state';
import { getHashSumLastNr } from './math';

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export const REEF_ADDRESS = '0x0000000000000000000000000000000001000000';
export const EMPTY_ADDRESS = '0x';
export const REEF_ADDRESS_SPECIFIC_STRING = '(ONLY for Reef chain!)';
export const MIN_REEF_TOKEN_BALANCE = 1;
export const MIN_EVM_TOKEN_BALANCE = 60;

export interface ButtonStatus {
  text: string;
  isValid: boolean;
}

export const trim = (value: string, size = 19): string => (value.length < size
  ? value
  : `${value.slice(0, size - 5)}...${value.slice(value.length - 5)}`);

export const toAddressShortDisplay = (address: string): string => trim(address, 7);

export const shortAddress = (address: string): string => (address.length > 10
  ? `${address.slice(0, 5)}...${address.slice(address.length - 5, address.length)}`
  : address);

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

export const removeUndefinedItem = <Type, >(item: (Type|undefined)): item is Type => item !== undefined;

export const formatAgoDate = (timestamp: number|string): string => {
  const now = new Date(Date.now());
  const date = new Date(timestamp);

  const difference = now.getTime() - date.getTime();
  if (difference < 1000 * 60) {
    return `${Math.round(difference / 1000)}sec ago`;
  }
  if (difference < 1000 * 60 * 60) {
    return `${Math.round(difference / 60000)}min ago`;
  }
  if (difference < 1000 * 60 * 60 * 24) {
    return `${Math.round(difference / 3600000)}h ago`;
  }
  return date.toDateString();
};

export const dropDuplicatesMultiKey = <Obj, Key extends keyof Obj>(
  objects: Obj[],
  keys: Key[],
): Obj[] => {
  const existingKeys = new Set<string>();
  const filtered: Obj[] = [];

  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const obj = objects[index];
    const ids = keys.map((key) => obj[key]).join(', ');
    if (!existingKeys.has(ids)) {
      filtered.push(obj);
      existingKeys.add(ids);
    }
  }

  return filtered;
};

export const removeReefSpecificStringFromAddress = (address: string): string => address.replace(REEF_ADDRESS_SPECIFIC_STRING, '').trim();
export const addReefSpecificStringFromAddress = (address: string): string => `${address}${REEF_ADDRESS_SPECIFIC_STRING}`;

/**
 *  Returns icnUrl if exists, otherwise return sample icon based on calculated
 *  checksum from provided address. Returned sample icon is svg encoded to base64
 *  and prefixed with data string, so it can be used directly with <img /> tag.
 */
export const getIconUrl = (tokenAddress = ''): string => {
  const reefToken = reefTokenWithAmount();

  if (tokenAddress === reefToken.address) {
    return reefToken.iconUrl;
  }

  const checkSum = getHashSumLastNr(tokenAddress);
  const nr = checkSum > -1 && checkSum < 10 ? checkSum : checkSum % 10;
  return `data:image/svg+xml;base64,${btoa(DEFAULT_TOKEN_ICONS[nr])}`;
};

export const showEvmCopyAddressAlert = (): void => {
  window.alert('ONLY use this address on Reef chain! DO NOT use this Reef EVM address on any other chain!');
};
