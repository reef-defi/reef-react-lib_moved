import { Signer } from '@reef-defi/evm-provider';
import { calculateAmount } from '../utils/math';
import { getREEF20Contract } from './rpc';
import { BasicToken, Token, TokenWithAmount } from '../state';

export const retrieveTokenAddresses = (tokens: Token[]): string[] => tokens.map((token) => token.address);

export const approveTokenAmount = async (token: TokenWithAmount, routerAddress: string, signer: Signer): Promise<void> => {
  const contract = await getREEF20Contract(token.address, signer);
  const bnAmount = calculateAmount(token);
  await contract.approve(routerAddress, bnAmount);
};

export const approveAmount = async (from: string, to: string, amount: string, signer: Signer): Promise<void> => {
  const contract = await getREEF20Contract(from, signer);
  await contract.approve(to, amount);
};

export const loadToken = async (address: string, signer: Signer, iconUrl: string): Promise<Token> => {
  const token = await getREEF20Contract(address, signer);

  const signerAddress = await signer.getAddress();
  const balance = await token.balanceOf(signerAddress);
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  return {
    iconUrl,
    decimals,
    address: token.address,
    balance: balance.toString(),
    name: symbol,
  };
};

export const loadTokens = async (addresses: BasicToken[], signer: Signer): Promise<Token[]> => Promise.all(
  addresses.map((token) => loadToken(token.address, signer, token.iconUrl)),
);
