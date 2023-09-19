import { network } from '@reef-chain/util-lib';
import { REEF_TOKEN, Token } from './token';

export type AvailableNetworks = 'mainnet' | 'testnet' | 'localhost';

export interface Bond {
  name: string;
  description: string;
  contractAddress: string;
  validatorAddress: string;
  stake: Token;
  farm: Token;
  apy: string;
}

export interface Network {
  rpcUrl: string;
  reefscanUrl: string;
  verificationApiUrl: string;
  factoryAddress: string;
  routerAddress: string;
  name: AvailableNetworks;
  graphqlExplorerUrl: string;
  graphqlDexsUrl: string;
  genesisHash: string;
  bonds: Bond[]
}

export const SS58_REEF = 42;

export type Networks = Record<AvailableNetworks, Network>;
export const availableNetworks: Networks = {
  testnet: {
    name: network.AVAILABLE_NETWORKS.testnet.name,
    rpcUrl: network.AVAILABLE_NETWORKS.testnet.rpcUrl,
    reefscanUrl: network.AVAILABLE_NETWORKS.testnet.reefscanUrl,
    verificationApiUrl: 'https://api-testnet.reefscan.com', // network.AVAILABLE_NETWORKS.testnet.verificationApiUrl,
    factoryAddress: '0x8Fc2f9577f6c58e6A91C4A80B45C03d1e71c031f', // network.AVAILABLE_NETWORKS.testnet.factoryAddress,
    routerAddress: '0xd855a7c33ebF6566e846B0D6F7Ba7f7e1fe99768', // network.AVAILABLE_NETWORKS.testnet.routerAddress,
    graphqlExplorerUrl: network.AVAILABLE_NETWORKS.testnet.graphqlUrl,
    graphqlDexsUrl: 'https://squid.subsquid.io/reef-swap-testnet/graphql', // network.AVAILABLE_NETWORKS.testnet.graphqlDexsUrl,
    genesisHash: network.AVAILABLE_NETWORKS.testnet.genesisHash,
    bonds: [],
  },
  mainnet: {
    name: network.AVAILABLE_NETWORKS.mainnet.name,
    rpcUrl: network.AVAILABLE_NETWORKS.mainnet.rpcUrl,
    reefscanUrl: network.AVAILABLE_NETWORKS.mainnet.reefscanUrl,
    verificationApiUrl: 'https://api.reefscan.com', // network.AVAILABLE_NETWORKS.mainnet.verificationApiUrl,
    factoryAddress: '0x380a9033500154872813F6E1120a81ed6c0760a8', // network.AVAILABLE_NETWORKS.mainnet.factoryAddress,
    routerAddress: '0x641e34931C03751BFED14C4087bA395303bEd1A5', // network.AVAILABLE_NETWORKS.mainnet.routerAddress,
    graphqlExplorerUrl: network.AVAILABLE_NETWORKS.mainnet.graphqlUrl,
    graphqlDexsUrl: 'https://squid.subsquid.io/reef-swap/graphql', // network.AVAILABLE_NETWORKS.mainnet.graphqlDexsUrl,
    genesisHash: network.AVAILABLE_NETWORKS.mainnet.genesisHash,
    bonds: [
      {
        name: 'Reef community staking bond',
        description: '',
        contractAddress: '0x7D3596b724cEB02f2669b902E4F1EEDeEfad3be6',
        validatorAddress: '5Hax9GZjpurht2RpDr5eNLKvEApECuNxUpmRbYs5iNh7LpHa',
        stake: { ...REEF_TOKEN },
        farm: { ...REEF_TOKEN },
        apy: '32',
      },
    ],
  },
  localhost: {
    name: network.AVAILABLE_NETWORKS.localhost.name,
    rpcUrl: network.AVAILABLE_NETWORKS.localhost.rpcUrl,
    reefscanUrl: network.AVAILABLE_NETWORKS.localhost.reefscanUrl,
    verificationApiUrl: 'http://localhost:8001', // network.AVAILABLE_NETWORKS.localhost.verificationApiUrl,
    factoryAddress: '', // network.AVAILABLE_NETWORKS.localhost.factoryAddress,
    routerAddress: '', // network.AVAILABLE_NETWORKS.localhost.routerAddress,
    graphqlExplorerUrl: network.AVAILABLE_NETWORKS.localhost.graphqlUrl,
    graphqlDexsUrl: 'http://localhost:4351/graphql', // network.AVAILABLE_NETWORKS.localhost.graphqlDexsUrl,
    genesisHash: network.AVAILABLE_NETWORKS.localhost.genesisHash,
    bonds: [],
  },
};
