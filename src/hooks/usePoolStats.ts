import { ApolloClient } from "@apollo/client";
import { BigNumber } from "ethers";
import { useState } from "react";
import { Amounts, PoolHourVolumeAggregate, PoolHourVolumeVar, PoolsTotalSupply, POOLS_TOTAL_SUPPLY, POOL_24H_VOLUME } from "../graphql/pools";
import { getTokenPrice, LastPoolReserves, Pool, TokenPrices } from "../state";
import { useAsyncEffect } from "./useAsyncEffect";


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

const queryPoolVolume = async (address: string, fromTime: string, client: ApolloClient<any>): Promise<Amounts> =>
  client.query<PoolHourVolumeAggregate, PoolHourVolumeVar>({
    query: POOL_24H_VOLUME,
    variables: {
      address,
      fromTime,
    }
  })
  .then((res) => res.data.pool_hour_volume_aggregate.aggregate.sum);



export const useTotalSupply = (pools: LastPoolReserves[], tokenPrices: TokenPrices, client: ApolloClient<any>): string => {
  const [totalSupply, setTotalSupply] = useState("0");

  // Updating token supply
  useAsyncEffect(async () => {
    const supplies = await client.query<PoolsTotalSupply>({
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

  return totalSupply
}

export const usePoolVolume = (pools: Pool[], tokenPrices: TokenPrices, apolloClient: ApolloClient<any>): string => {
  const [volume, setVolume] = useState("0");

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

  return volume;
};

