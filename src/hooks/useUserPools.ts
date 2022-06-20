import { ApolloClient } from "@apollo/client";
import { BigNumber } from "ethers";
import { useState } from "react";
import { Amounts, PoolLPQuery, PoolUserLpVar, PoolVar, POOL_LP, POOL_USER_LP } from "../graphql/pools";
import { getTokenPrice, LastPoolReserves, TokenPrices } from "../state";
import { useAsyncEffect } from "./useAsyncEffect";


export type PoolsLPTokens = {[poolAddress: string]: BigNumber};

const queryUserPool = async (userAddress: string, address: string, client: ApolloClient<any>): Promise<Amounts> => client
  .query<PoolLPQuery, PoolUserLpVar>({
    query: POOL_USER_LP,
    variables: {
      address,
      userAddress,
    }
  })
  .then((res) => res.data.pool_event_aggregate.aggregate.sum);

const queryPoolLp = async (address: string, client: ApolloClient<any>): Promise<Amounts> => client
  .query<PoolLPQuery, PoolVar>({
    query: POOL_LP,
    variables: { address }
  })
  .then((res) => res.data.pool_event_aggregate.aggregate.sum);

export const useUserPools = (userNativeAddress: string, pools: LastPoolReserves[], tokenPrices: TokenPrices, client: ApolloClient<any>): LastPoolReserves[] => {
  const [userReserves, setUserReserves] = useState<LastPoolReserves[]>([]);

  useAsyncEffect(async () => {
    if (pools.length === 0 || Object.keys(tokenPrices).length === 0) {
      return;
    }

    const results = await Promise.all(
      pools.map(async ({address, token_1, token_2}) => ({
        address,
        token_1,
        token_2,
        amounts: await queryUserPool(userNativeAddress, address, client)
      }))
    );

    setUserReserves(results
      .filter(({amounts: {amount_1, amount_2}}) => amount_1 !== null && amount_2 !== null)
      .map(({address, token_1, token_2, amounts: {amount_1, amount_2}}) => ({
        address,
        token_1,
        token_2,
        reserved_1: amount_1,
        reserved_2: amount_2,
      }))
    );
  }, [userNativeAddress, pools, tokenPrices]);

  return userReserves;
}

export const usePoolLP = (pools: LastPoolReserves[], tokenPrices: TokenPrices, client: ApolloClient<any>): PoolsLPTokens => {
  const [lpTokens, setLpTokens] = useState<PoolsLPTokens>({});

  useAsyncEffect(async () => {
    if (pools.length === 0 || Object.keys(tokenPrices).length === 0) {
      return;
    }

    const res = await Promise.all(
      pools.map(async ({address, token_1, token_2}) => ({
        address,
        token_1,
        token_2,
        amounts: await queryPoolLp(address, client)
      }))
    );

    const amounts: PoolsLPTokens = res.reduce((acc, {address, token_1, token_2, amounts: {amount_1, amount_2}}) => {
      const tokenPrice1 = getTokenPrice(token_1, tokenPrices);
      const tokenPrice2 = getTokenPrice(token_2, tokenPrices);
      const result = tokenPrice1.mul(amount_1).add(tokenPrice2.mul(amount_2))
      return {...acc, [address]: result};
    }, {});
    setLpTokens(amounts);

  }, [pools, tokenPrices]);

  return lpTokens;
}

