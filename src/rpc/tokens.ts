import { Signer } from '@reef-defi/evm-provider';
import { calculateAmount } from '../utils/math';
import { getREEF20Contract } from './rpc';
import { BasicToken, Token, TokenWithAmount } from '../state';

export const retrieveTokenAddresses = (tokens: Token[]): string[] => tokens.map((token) => token.address);

export const approveTokenAmount = async (
  token: TokenWithAmount,
  routerAddress: string,
  signer: Signer,
): Promise<void> => {
  const tokenContract = await getREEF20Contract(token.address, signer);
  if (tokenContract) {
    const bnAmount = calculateAmount(token);
    await tokenContract.contract.approve(routerAddress, bnAmount);
    return;
  }
  throw new Error(`Token contract does not exist addr=${token.address}`);
};

export const approveAmount = async (
  from: string,
  to: string,
  amount: string,
  signer: Signer,
): Promise<void> => {
  const tokenContract = await getREEF20Contract(from, signer);
  if (tokenContract) {
    await tokenContract.contract.approve(to, amount);
    return;
  }
  throw new Error(`Token contract does not exist addr=${from}`);
};

export const loadToken = async (
  address: string,
  signer: Signer,
  iconUrl = '',
): Promise<Token | null> => {
  // TODO resolve iconUrl base64 from address
  const contractValue = await getREEF20Contract(address, signer);
  if (!contractValue) {
    console.log('Token contract does not exist addr=', address);
    return null;
  }
  const signerAddress = await signer.getAddress();
  const balance = await contractValue.contract.balanceOf(signerAddress);

  return {
    iconUrl,
    decimals: contractValue.values.decimals,
    address: contractValue.contract.address,
    balance: balance.toString(),
    name: contractValue.values.name,
    symbol: contractValue.values.symbol,
  };
};

export const loadTokens = async (
  addresses: BasicToken[],
  signer: Signer,
): Promise<(Token | null
)[]> => Promise.all(
  addresses.map((token) => loadToken(token.address, signer, token.iconUrl)),
);
