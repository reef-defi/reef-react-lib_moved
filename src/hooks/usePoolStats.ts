import { ApolloClient, gql } from "@apollo/client";
import { useState } from "react";
import { Pool, TokenPrices } from "../state";
import { useAsyncEffect } from "./useAsyncEffect";
import { BigNumber } from "ethers";



const getTokenPrice = (address: string, prices: TokenPrices): BigNumber => BigNumber.from(!!prices[address]
  ? prices[address]
  : 0
);

// TODO: This query is not the best cause volume captures volumes per day and not by hour!
// Will address this problem in the next update of explorer
// This is how the end solution will look like!
// const POOLS_24H_VOLUMES = gql`
// query pool_24h_volumes($from: timestamptz!) {
//   pool {
//     address
//     token_1
//     token_2
//     volume(where: {
//       timeframe: { _gt: $from }
//     }) {
//       amount_1,
//       amount_2
//     }
//   }
// }
// `;

interface Amounts {
  amount_1: string,
  amount_2: string,
}

interface PoolHourVolumeAggregate {
  pool_hour_volume_aggregate: {
    aggregate: {
      sum: Amounts
    }
  }
}

interface PoolHourVolumeVar {
  poolAddress: string;
  timeframe: string;
}

// Aggregating pool hour volume
const POOL_24H_VOLUME = gql`
query volume($poolAddress: String!, $timeframe: $timestampz!) {
  pool_hour_volume_aggregate(
    where: {
      pool: {
        address: { _eq: $poolAddress }
      }
      timeframe: { _gt: $timeframe }
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
`;

const queryPoolVolume = async (address: string, from: string, client: ApolloClient<any>): Promise<Amounts> =>
  client.query<PoolHourVolumeAggregate, PoolHourVolumeVar>({
    query: POOL_24H_VOLUME,
    variables: {
      timeframe: from,
      poolAddress: address,
    }
  })
  .then((res) => res.data.pool_hour_volume_aggregate.aggregate.sum);


interface PoolTotalSupply {
  pool: {
    token_1: string;
    token_2: string;
  };
  reserved_1: string;
  reserved_2: string;
}
interface PoolsTotalSupply {
  pool_event: PoolTotalSupply[];
};

const POOLS_TOTAL_SUPPLY = gql`
query total_supply {
  pool_event(
    distinct_on: pool_id
    where: {
      type: { _eq: "Sync" }
    }
    order_by: {
      pool_id: asc
      timestamp: desc
    }
  ) {
    pool {
      token_1
      token_2
    }
    reserved_1
    reserved_2
  }
}
`

const usePoolStats = (pools: Pool[], tokenPrices: TokenPrices, apolloClient: ApolloClient<any>) => {
  const [volume, setVolume] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");

  const yesterdayAtMidnight = new Date(Date.now() - 24*60*60*1000).toUTCString();

  // TODO: When you will have time group both functions into generic one
  // Updating volume
  useAsyncEffect(async () => {
    const volumes = await Promise.all(
      pools.map(async ({poolAddress, token1, token2}) => ({
        token1,
        token2,
        amounts: await queryPoolVolume(poolAddress, yesterdayAtMidnight, apolloClient)
      }))
    );
    const summedVolumes = volumes.reduce((acc, {token1, token2, amounts}) => {
      const tokenPrice1 = getTokenPrice(token1.address, tokenPrices);
      const tokenPrice2 = getTokenPrice(token2.address, tokenPrices);

      return acc
        .add(tokenPrice1.mul(amounts.amount_1))
        .add(tokenPrice2.mul(amounts.amount_2));
    }, BigNumber.from(0))

    setVolume(summedVolumes.toString());
  }, [pools, tokenPrices]);

  // Updating token supply
  useAsyncEffect(async () => {
    const supplies = await apolloClient.query<PoolsTotalSupply>({
        query: POOLS_TOTAL_SUPPLY,
      })
      .then((res) => res.data.pool_event);

    const supply = supplies
    .reduce((acc, {pool: {token_1, token_2}, reserved_1, reserved_2}) => {
      const tokenPrice1 = getTokenPrice(token_1, tokenPrices)
      const tokenPrice2 = getTokenPrice(token_2, tokenPrices)

      return acc
        .add(tokenPrice1.mul(reserved_1))
        .add(tokenPrice2.mul(reserved_2));
    }, BigNumber.from(0));

    setTotalSupply(supply.toString());
  }, [pools, tokenPrices])

  return [totalSupply, volume];
};

export default usePoolStats;
