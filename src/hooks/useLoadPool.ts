import { useState, useEffect } from 'react';
import { Pool, Token } from '..';
import { ApolloClient } from '@apollo/client';
import { USER_POOL_SUPPLY, UserPoolSupplyQuery, UserPoolSupplyVar } from '../graphql/pools';
import { EMPTY_ADDRESS, ensure } from '../utils';
import { BigNumber } from 'ethers';

type LoadingPool = Pool | undefined;

export const loadPool = async (
  token1: Token,
  token2: Token,
  signerAddress: string,
  dexClient: ApolloClient<any>,
): Promise<Pool> => {
  const result = await dexClient.query<UserPoolSupplyQuery, UserPoolSupplyVar>(
    {
      query: USER_POOL_SUPPLY,
      variables: {
        token1: token1.address,
        token2: token2.address,
        signerAddress: signerAddress,
      },
    },
  );

  const userPoolSupply = result.data?.userPoolSupply || undefined;

  ensure(!!userPoolSupply && userPoolSupply.address !== EMPTY_ADDRESS, 'Pool does not exist!');

  const address = userPoolSupply.address;
  const decimals = userPoolSupply.decimals;
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
  dexClient?: ApolloClient<any>,
  disable?: boolean,
): [LoadingPool, boolean] => {
  const [pool, setPool] = useState<Pool>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!token1.address || !token2.address || token2.address === '0x' || userAddress === '' || !dexClient || disable) {
        return;
      }
      Promise.resolve()
        .then(() => setIsLoading(true))
        .then(() => loadPool(token1, token2, userAddress, dexClient))
        .then(setPool)
        .catch(() => setPool(undefined))
        .finally(() => setIsLoading(false));
    };

    load();
  }, [token1.address, token2.address, token1.balance, token2.balance]);

  return [pool, isLoading];
};
