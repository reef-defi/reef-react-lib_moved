import { Signer } from "@reef-defi/evm-provider";
import { BasicToken, Network, Token, TokenWithAmount } from "../state";
import { availableReefNetworks } from "../utils";
import { calculateAmount } from "../utils/math";
import { getContract } from "./rpc";

// TODO Move and load from reefscan-api!
export const loadVerifiedERC20Tokens = async ({ name }: Network): Promise<BasicToken[]> => {
  switch (name) {
    case 'testnet': return [...availableReefNetworks.tokens];
    case 'mainnet': return [...availableReefNetworks.tokens];
    default: throw new Error('Chain URL does not exist!');
  }
};

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
