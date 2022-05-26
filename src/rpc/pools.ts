import { Signer } from '@reef-defi/evm-provider';
import { Contract } from 'ethers';
import { ensure, uniqueCombinations } from '../utils/utils';
import { ReefswapPair } from '../assets/abi/ReefswapPair';
import { getReefswapFactory } from './rpc';
import { Token, Pool } from '..';
import { ERC20 } from '../assets/abi/ERC20';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

const findPoolTokenAddress = async (
  address1: string,
  address2: string,
  signer: Signer,
  factoryAddress: string,
): Promise<string> => {
  const reefswapFactory = getReefswapFactory(factoryAddress, signer);
  const address = await reefswapFactory.getPair(address1, address2);
  return address;
};

export const loadPool = async (
  token1: Token,
  token2: Token,
  signer: Signer,
  factoryAddress: string,
): Promise<Pool> => {
  const address = await findPoolTokenAddress(
    token1.address,
    token2.address,
    signer,
    factoryAddress,
  );
  ensure(address !== EMPTY_ADDRESS, 'Pool does not exist!');
  const contract = new Contract(address, ReefswapPair, signer);
  const tokenContract1 = new Contract(token1.address, ERC20, signer);
  const tokenContract2 = new Contract(token2.address, ERC20, signer);

  const decimals = await contract.decimals();
  const reserves = await contract.getReserves();
  const totalSupply = await contract.totalSupply();
  const minimumLiquidity = await contract.MINIMUM_LIQUIDITY();
  const liquidity = await contract.balanceOf(await signer.getAddress());

  const address1 = await contract.token1();

  const [finalReserve1, finalReserve2] = token1.address !== address1
    ? [reserves[0], reserves[1]]
    : [reserves[1], reserves[0]];

  const tokenBalance1 = await tokenContract1.balanceOf(address);
  const tokenBalance2 = await tokenContract2.balanceOf(address);

  return {
    poolAddress: address,
    decimals: parseInt(decimals, 10),
    reserve1: finalReserve1.toString(),
    reserve2: finalReserve2.toString(),
    totalSupply: totalSupply.toString(),
    userPoolBalance: liquidity.toString(),
    minimumLiquidity: minimumLiquidity.toString(),
    token1: {...token1, balance: tokenBalance1},
    token2: {...token2, balance: tokenBalance2},
  };
};

export const loadPools = async (
  tokens: Token[],
  signer: Signer,
  factoryAddress: string,
): Promise<Pool[]> => {
  const tokenCombinations = uniqueCombinations(tokens);
  const pools: Pool[] = [];
  for (let index = 0; index < tokenCombinations.length; index += 1) {
    try {
      const [token1, token2] = tokenCombinations[index];
      /* eslint-disable no-await-in-loop */
      const pool = await loadPool(token1, token2, signer, factoryAddress);
      /* eslint-disable no-await-in-loop */
      pools.push(pool);
    } catch (e) {}
  }
  return pools;
};
