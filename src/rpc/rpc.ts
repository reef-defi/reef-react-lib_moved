import { Signer } from '@reef-defi/evm-provider';
import { BigNumber, Contract } from 'ethers';
import axios from 'axios';
import { ERC20 } from '../assets/abi/ERC20';
import { ReefswapFactory } from '../assets/abi/ReefswapFactory';
import { ReefswapRouter } from '../assets/abi/ReefswapRouter';
import { Network, Token } from '../state';

export const checkIfERC20ContractExist = async (
  address: string,
  signer: Signer,
): Promise<void> => {
  try {
    const contract = new Contract(address, ERC20, signer);
    // TODO add additional checkers to be surtent of Contract existance
    await contract.name();
    await contract.symbol();
    await contract.decimals();
  } catch (error) {
    throw new Error('Unknown address');
  }
};

export const getContract = async (
  address: string,
  signer: Signer,
): Promise<Contract> => {
  await checkIfERC20ContractExist(address, signer);
  return new Contract(address, ERC20, signer);
};

export const balanceOf = async (
  address: string,
  balanceAddress: string,
  signer: Signer,
): Promise<BigNumber> => {
  const contract = await getContract(address, signer);
  const balance = await contract.balanceOf(balanceAddress);
  return balance;
};

export const getReefswapRouter = (address: string, signer: Signer): Contract => new Contract(address, ReefswapRouter, signer);
export const getReefswapFactory = (address: string, signer: Signer): Contract => new Contract(address, ReefswapFactory, signer);

export const loadAccountTokens = async (address: string, network: Network): Promise<Token[]> => {
  try {
    return axios.post(`${network.reefscanUrl}/api/account/tokens`, { account: address });
  } catch (err) {
    console.log('loadAccountTokens error = ', err);
    return Promise.resolve([]);
  }
};
