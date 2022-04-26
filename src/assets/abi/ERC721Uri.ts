import { ContractInterface } from 'ethers';

export const ERC721Uri: ContractInterface = [{
  inputs: [
    {
      internalType: 'uint256',
      name: 'tokenId',
      type: 'uint256',
    },
  ],
  name: 'tokenURI',
  outputs: [
    {
      internalType: 'string',
      name: '',
      type: 'string',
    },
  ],
  stateMutability: 'view',
  type: 'function',
}];
