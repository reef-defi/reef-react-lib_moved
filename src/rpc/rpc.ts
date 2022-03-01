import { Signer } from '@reef-defi/evm-provider';
import { BigNumber, Contract } from 'ethers';
import { ERC20 } from '../assets/abi/ERC20';
import { ReefswapFactory } from '../assets/abi/ReefswapFactory';
import { ReefswapRouter } from '../assets/abi/ReefswapRouter';
import { createEmptyToken, ReefSigner, Token } from '../state';

export const checkIfERC20ContractExist = async (
  address: string,
  signer: Signer,
): Promise<{ name: string; symbol: string; decimals: number } | undefined> => {
  try {
    const contract = new Contract(address, ERC20, signer);
    // TODO add additional checkers to be certain of Contract existence
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    return { name, symbol, decimals };
  } catch (error) {
    throw new Error('Unknown address');
  }
};

export const getREEF20Contract = async (
  address: string,
  signer: Signer,
): Promise<{
  contract: Contract;
  values: { name: string; symbol: string; decimals: number };
} | null> => {
  try {
    const values = await checkIfERC20ContractExist(address, signer);
    if (values) {
      return { contract: new Contract(address, ERC20, signer), values };
    }
  } catch (err) {}
  return null;
};

export const contractToToken = async (
  tokenContract: Contract,
  signer: ReefSigner,
): Promise<Token> => {
  const contractToken = createEmptyToken();
  contractToken.address = tokenContract.address;
  contractToken.name = await tokenContract.name();
  contractToken.symbol = await tokenContract.symbol();
  contractToken.balance = await tokenContract.balanceOf(signer.evmAddress);
  contractToken.decimals = await tokenContract.decimals();
  return contractToken;
};

export const balanceOf = async (
  address: string,
  balanceAddress: string,
  signer: Signer,
): Promise<BigNumber | null> => {
  const contract = (await getREEF20Contract(address, signer))?.contract;
  return contract ? contract.balanceOf(balanceAddress) : null;
};

export const getReefswapRouter = (address: string, signer: Signer): Contract => new Contract(address, ReefswapRouter, signer);
export const getReefswapFactory = (address: string, signer: Signer): Contract => new Contract(address, ReefswapFactory, signer);
