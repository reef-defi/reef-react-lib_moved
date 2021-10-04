import { Networks } from '../state';

export interface ButtonStatus {
  text: string;
  isValid: boolean;
}

export const trim = (value: string, size = 19): string => (value.length < size
  ? value
  : `${value.slice(0, size - 5)}...${value.slice(value.length - 4)}`);

export const ensure = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
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

export const availableReefNetworks: Networks = {
  testnet: {
    name: 'testnet',
    rpcUrl: 'wss://rpc-testnet.reefscan.com/ws',
    reefscanUrl: 'https://testnet.reefscan.com/',
    factoryAddress: '0xcA36bA38f2776184242d3652b17bA4A77842707e',
    routerAddress: '0x0A2906130B1EcBffbE1Edb63D5417002956dFd41',
  },
  mainnet: {
    name: 'mainnet',
    rpcUrl: 'wss://rpc.reefscan.com/ws',
    reefscanUrl: 'https://reefscan.com/',
    routerAddress: '0x641e34931C03751BFED14C4087bA395303bEd1A5',
    factoryAddress: '0x380a9033500154872813F6E1120a81ed6c0760a8',
  },
};
