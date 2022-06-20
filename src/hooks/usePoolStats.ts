import { ApolloClient } from "@apollo/client";
import { BigNumber } from "ethers";
import { useState } from "react";
import { Pool24HVolume, PoolsTotalSupply, POOLS_TOTAL_SUPPLY, PoolVolume24HVar, POOL_24H_VOLUME } from "../graphql/pools";
import { getTokenPrice, Pool, TokenPrices } from "../state";
import { useAsyncEffect } from "./useAsyncEffect";

export const useTotalSupply = (tokenPrices: TokenPrices, client: ApolloClient<any>): string => {
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
  }, [tokenPrices])

  return totalSupply
}

export const usePoolVolume = (pools: Pool[], tokenPrices: TokenPrices, client: ApolloClient<any>): string => {
  const [volume, setVolume] = useState("0");

  useAsyncEffect(async () => {
    const volumes = await client.query<Pool24HVolume, PoolVolume24HVar>({
        query: POOL_24H_VOLUME,
        variables: {
          fromTime: new Date(Date.now() - 24*60*60*1000).toUTCString()
        }
      })
      .then((res) => res.data.pool_hour_volume);

    const summedVolumes = volumes.reduce((acc, {amount_1, amount_2, pool: {token_1, token_2}}) => {
      const tokenPrice1 = getTokenPrice(token_1, tokenPrices);
      const tokenPrice2 = getTokenPrice(token_2, tokenPrices);

      return acc
        .add(tokenPrice1.mul(amount_1))
        .add(tokenPrice2.mul(amount_2));
    }, BigNumber.from(0))

    setVolume(summedVolumes.toString());
  }, [pools, tokenPrices]);

  return volume;
};

