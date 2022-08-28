import { BasicToken } from './token';

export type NFTTypes = 'ERC1155' | 'ERC721';

export interface ERC721ContractData {
  type: 'ERC721'
  name: string;
  symbol: string;
}

export interface ERC1155ContractData {
  type: 'ERC1155'
}

export interface NFT extends BasicToken {
  nftId: number;
  balance: string;
  type: NFTTypes;
  data: ERC1155ContractData | ERC721ContractData;
}
