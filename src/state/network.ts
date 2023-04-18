import { REEF_TOKEN, Token } from "./token";
import {network} from '@reef-chain/util-lib';

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
    name: 'testnet',
    rpcUrl: network.AVAILABLE_NETWORKS.testnet.rpcUrl,
    reefscanUrl: network.AVAILABLE_NETWORKS.testnet.reefscanUrl,
    verificationApiUrl: 'https://api-testnet.reefscan.com', // network.AVAILABLE_NETWORKS.testnet.verificationApiUrl,
    factoryAddress: '0x06D7a7334B9329D0750FFd0a636D6C3dFA77E580', // getReefswapNetworkConfig(network.AVAILABLE_NETWORKS.testnet).factoryAddress,
    routerAddress: '0xa29DFc7329ac30445Ba963E313fD26E171722057', // getReefswapNetworkConfig(network.AVAILABLE_NETWORKS.testnet).routerAddress,
    graphqlExplorerUrl: network.AVAILABLE_NETWORKS.testnet.graphqlUrl,
    graphqlDexsUrl: "https://squid.subsquid.io/reef-swap-testnet/graphql", // getReefswapNetworkConfig(network.AVAILABLE_NETWORKS.testnet).graphqlDexsUrl,
    genesisHash: '0xb414a8602b2251fa538d38a9322391500bd0324bc7ac6048845d57c37dd83fe6', // network.AVAILABLE_NETWORKS.testnet.genesisHash,
    bonds: [],
  },
  mainnet: {
    name: 'mainnet',
    rpcUrl: network.AVAILABLE_NETWORKS.mainnet.rpcUrl,
    reefscanUrl: network.AVAILABLE_NETWORKS.mainnet.reefscanUrl,
    verificationApiUrl: 'https://api.reefscan.com', // network.AVAILABLE_NETWORKS.mainnet.verificationApiUrl,
    factoryAddress: '0x380a9033500154872813F6E1120a81ed6c0760a8', // getReefswapNetworkConfig(network.AVAILABLE_NETWORKS.mainnet).factoryAddress,
    routerAddress: '0x641e34931C03751BFED14C4087bA395303bEd1A5', // getReefswapNetworkConfig(network.AVAILABLE_NETWORKS.mainnet).routerAddress,
    graphqlExplorerUrl: network.AVAILABLE_NETWORKS.mainnet.graphqlUrl,
    graphqlDexsUrl: "https://squid.subsquid.io/reef-swap/graphql", // getReefswapNetworkConfig(network.AVAILABLE_NETWORKS.mainnet).graphqlDexsUrl,
    genesisHash: network.AVAILABLE_NETWORKS.mainnet.genesisHash, // '0x7834781d38e4798d548e34ec947d19deea29df148a7bf32484b7b24dacf8d4b7',
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
    name: 'localhost',
    rpcUrl: 'ws://localhost:9944',
    reefscanUrl: 'http://localhost:8000',
    verificationApiUrl: 'http://localhost:8001',
    factoryAddress: '0xD3ba2aA7dfD7d6657D5947f3870A636c7351EfE4',
    routerAddress: '0x818Be9d50d84CF31dB5cefc7e50e60Ceb73c1eb5',
    graphqlExplorerUrl: 'ws://localhost:8080/v1/graphql',
    graphqlDexsUrl: "http://localhost:4351/graphql", // TODO - add to util-lib
    genesisHash: '', // TODO ?
    bonds: [],
  },
};
