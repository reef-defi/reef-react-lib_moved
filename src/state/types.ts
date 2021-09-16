import {BigNumber} from "ethers";
import { Signer } from '@reef-defi/evm-provider';

export interface BasicToken {
  name: string;
  address: string;
  iconUrl: string;
}

export interface Token extends BasicToken {
  balance: BigNumber;
  decimals: number;
}

export interface TokenWithAmount extends Token {
  amount: string;
  price: number;
  isEmpty: boolean;
}

export interface Pool {
  token1: Token;
  token2: Token;
  decimals: number;
  // TODO transform reserve1, reserve2, userPoolBalance and minimumLiquidity to BigNumber
  reserve1: string;
  reserve2: string;
  totalSupply: string;
  poolAddress: string;
  userPoolBalance: string;
  minimumLiquidity: string;
}

export type AvailableNetworks = 'mainnet' | 'testnet';

export interface Network {
  rpcUrl: string;
  reefscanUrl: string;
  routerAddress: string;
  factoryAddress: string;
  name: AvailableNetworks;
};

export type Networks = Record<AvailableNetworks, Network>;


export interface ReefSigner {
  signer: Signer;
  name: string;
  address: string;
  evmAddress: string;
  isEvmClaimed: boolean;
}
