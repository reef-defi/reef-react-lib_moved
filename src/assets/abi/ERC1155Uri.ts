import { ContractInterface } from 'ethers';

export const ERC1155Uri: ContractInterface = [{
  inputs: [
    {
      internalType: 'uint256',
      name: '',
      type: 'uint256',
    },
  ],
  name: 'uri',
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
