import { useState, useEffect } from 'react';
import { BigNumber } from 'ethers';
import { Pool, Token } from '..';
import { USER_POOL_SUPPLY } from '../graphql/pools';
import { EMPTY_ADDRESS, ensure } from '../utils';
import  { AxiosInstance } from 'axios';
import { graphqlRequest } from '../graphql/utils';

type LoadingPool = Pool | undefined;

export const getUserPoolSupply = (token1:string, token2:string, signerAddress:string) => ({
  query: USER_POOL_SUPPLY,
  variables: { token1, token2, signerAddress },
});

export const loadPool = async (
  token1: Token,
  token2: Token,
  signerAddress: string,
  httpClient:AxiosInstance,
): Promise<Pool> => {
  const getUserPoolQry = getUserPoolSupply(token1.address, token2.address, signerAddress);
  const result = await graphqlRequest(httpClient, getUserPoolQry);
  const userPoolSupply = result.data.data?.userPoolSupply || undefined;

  ensure(!!userPoolSupply && userPoolSupply.address !== EMPTY_ADDRESS, 'Pool does not exist!');

  const { address } = userPoolSupply;
  const { decimals } = userPoolSupply;
  const reserves1 = BigNumber.from(userPoolSupply.reserved1);
  const reserves2 = BigNumber.from(userPoolSupply.reserved2);
  const totalSupply = BigNumber.from(userPoolSupply.totalSupply);
  const liquidity = BigNumber.from(userPoolSupply.userSupply);

  const tokenBalance1 = reserves1.mul(liquidity).div(totalSupply);
  const tokenBalance2 = reserves2.mul(liquidity).div(totalSupply);

  return {
    poolAddress: address,
    decimals,
    reserve1: reserves1.toString(),
    reserve2: reserves2.toString(),
    totalSupply: totalSupply.toString(),
    userPoolBalance: liquidity.toString(),
    token1: { ...token1, balance: tokenBalance1 },
    token2: { ...token2, balance: tokenBalance2 },
  };
};

export const useLoadPool = (
  token1: Token,
  token2: Token,
  userAddress: string,
  httpClient?:AxiosInstance,
  disable?: boolean,
): [LoadingPool, boolean] => {
  const [pool, setPool] = useState<Pool>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!token1.address || !token2.address || token2.address === '0x' || userAddress === '' || !httpClient || disable) {
        return;
      }
      Promise.resolve()
        .then(() => setIsLoading(true))
        .then(() => loadPool(token1, token2, userAddress, httpClient))
        .then(setPool)
        .catch(() => setPool(undefined))
        .finally(() => setIsLoading(false));
    };

    load();
  }, [token1.address, token2.address, token1.balance, token2.balance]);

  return [pool, isLoading];
};