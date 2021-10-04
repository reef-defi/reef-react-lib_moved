import { Signer } from '@reef-defi/evm-provider';
import { Token, TokenWithAmount } from '../state';
import { calculateAmount } from '../utils/math';
import { getContract } from './rpc';

export const retrieveTokenAddresses = (tokens: Token[]): string[] => tokens.map((token) => token.address);

export const approveTokenAmount = async (token: TokenWithAmount, routerAddress: string, signer: Signer): Promise<void> => {
  const contract = await getContract(token.address, signer);
  const bnAmount = calculateAmount(token);
  await contract.approve(routerAddress, bnAmount);
};

export const approveAmount = async (from: string, to: string, amount: string, signer: Signer): Promise<void> => {
  const contract = await getContract(from, signer);
  await contract.approve(to, amount);
};
