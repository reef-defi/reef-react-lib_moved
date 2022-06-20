import { ApolloClient, gql } from "@apollo/client";
import { BigNumber } from "ethers";
import { useState } from "react";
import { LastPoolReserves, TokenPrices } from "../state";
import { useAsyncEffect } from "./useAsyncEffect";

interface Amounts {
  amount_1: number,
  amount_2: number,
}

type PoolsLPTokens = {[poolAddress: string]: BigNumber};

interface LPTokens {
  pool_event_aggregate: {
    aggregate: {
      sum: Amounts;
    };
  };
};

interface LpPoolTokenVar {
  poolAddress: string;
}
interface LpUserTokenVar extends LpPoolTokenVar {
  userAddress: string;
}

const LP_USER_TOKENS = gql`
query lp_tokens($userAddress: String!, $poolAddress: String!) {
  pool_event_aggregate(
    where: {
      pool: {
        address: { _eq: $poolAddress }
      }
      evm_event: {
        event: {
          extrinsic: {
            signer: { _eq: $userAddress }
          }
        }
      }
      _or: [
        { type: { _eq: "Burn" } }
        { type: { _eq: "Mint" } }
      ]
    }
  ) {
    aggregate {
      sum {
        amount_1
        amount_2
      }
    }
  }
}
`

const POOL_LP = gql`
query pool_lp($poolAdress: String!) {
  pool_event_aggregate(
    where: {
      pool: {
        address: { _eq: $poolAddress }
      }
      _or: [
        { type: {_eq: "Burn" } }
        { type: {_eq: "Mint" } }
      ]
    }

  ) {
    aggregate {
      sum {
        amount_1
        amount_2
      }
    }
  }
}

`


const getTokenPrice = (address: string, prices: TokenPrices): BigNumber => BigNumber.from(!!prices[address]
  ? prices[address]
  : 0
);


const queryUserPool = async (userAddress: string, poolAddress: string, client: ApolloClient<any>): Promise<Amounts> => client
  .query<LPTokens, LpUserTokenVar>({
    query: LP_USER_TOKENS,
    variables: {
      userAddress,
      poolAddress,
    }
  })
  .then((res) => res.data.pool_event_aggregate.aggregate.sum);

const queryPoolLp = async (poolAddress: string, client: ApolloClient<any>): Promise<Amounts> => client
  .query<LPTokens, LpPoolTokenVar>({
    query: POOL_LP,
    variables: { poolAddress }
  })
  .then((res) => res.data.pool_event_aggregate.aggregate.sum);

export const useUserPools = (userNativeAddress: string, pools: LastPoolReserves[], tokenPrices: TokenPrices, client: ApolloClient<any>) => {
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

