import { Signer } from '@reef-defi/evm-provider';
import { BigNumber, Contract } from 'ethers';
import { ensure, uniqueCombinations } from '../utils/utils';
import { ReefswapPair } from '../assets/abi/ReefswapPair';
import { balanceOf, getReefswapFactory } from './rpc';
import { Token, Pool } from '..';

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

  const decimals = await contract.decimals();
  const reserves = await contract.getReserves();
  const totalSupply = await contract.totalSupply();
  const minimumLiquidity = await contract.MINIMUM_LIQUIDITY();
  const liquidity = await contract.balanceOf(await signer.getAddress());

  const address1 = await contract.token1();

  const tokenBalance1 = (await balanceOf(token1.address, address, signer)) || BigNumber.from('0');
  const tokenBalance2 = (await balanceOf(token2.address, address, signer)) || BigNumber.from('0');

  const [finalToken1, finalToken2] = token1.address === address1
    ? [
      { ...token1, balance: tokenBalance1 },
      { ...token2, balance: tokenBalance2 },
    ]
    : [
      { ...token2, balance: tokenBalance2 },
      { ...token1, balance: tokenBalance1 },
    ];

  const [finalReserve1, finalReserve2] = token1.address === address1
    ? [reserves[0], reserves[1]]
    : [reserves[1], reserves[0]];

  return {
    poolAddress: address,
    decimals: parseInt(decimals, 10),
    reserve1: finalReserve1.toString(),
    reserve2: finalReserve2.toString(),
    totalSupply: totalSupply.toString(),
    userPoolBalance: liquidity.toString(),
    minimumLiquidity: minimumLiquidity.toString(),
    token1: finalToken1,
    token2: finalToken2,
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
