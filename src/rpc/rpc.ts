import { ERC20 } from '../assets/abi/ERC20';
import {ReefswapFactory} from '../assets/abi/ReefswapFactory';
import {ReefswapRouter} from '../assets/abi/ReefswapRouter';
import { Network } from '../state/types';
import { Signer } from "@reef-defi/evm-provider";
import { BigNumber, Contract } from "ethers";

export const checkIfERC20ContractExist = async (address: string, signer: Signer): Promise<void> => {
  try {
    const contract = new Contract(address, ERC20, signer);

    // TODO add additional checkers to be surtent of Contract existance
    await contract.name();
    await contract.symbol();
    await contract.decimals();
  } catch (error) {
    console.error(error);
    throw new Error('Unknown address');
  }
};

export const getContract = async (address: string, signer: Signer): Promise<Contract> => {
  await checkIfERC20ContractExist(address, signer);
  return new Contract(address, ERC20, signer);
};

export const balanceOf = async (address: string, balanceAddress: string, signer: Signer): Promise<BigNumber> => {
  const contract = await getContract(address, signer);
  const balance = await contract.balanceOf(balanceAddress);
  return balance;
};

export const getReefswapRouter = (network: Network, signer: Signer): Contract => new Contract(network.routerAddress, ReefswapRouter, signer);
export const getReefswapFactory = (network: Network, signer: Signer): Contract => new Contract(network.factoryAddress, ReefswapFactory, signer);
