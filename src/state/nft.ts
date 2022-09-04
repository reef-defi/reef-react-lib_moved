import {ContractType, Token} from './token';

export interface ERC721ContractData {
  type: ContractType.ERC721
  name: string;
  symbol: string;
}

export interface ERC1155ContractData {
  type: ContractType.ERC1155
}

export interface NFT extends Token {
  nftId: string;
  data: ERC1155ContractData | ERC721ContractData;
  contractType: ContractType;
  mimetype?: string;
}
