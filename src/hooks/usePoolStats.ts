import { useQuery } from "@apollo/client";
import { BigNumber } from "bignumber.js";
import { useMemo } from "react";
import { Pool24HVolume, PoolsTotalSupply, POOLS_TOTAL_VALUE_LOCKED, PoolVolume24HVar, POOL_24H_VOLUME } from "../graphql/pools";
import { getTokenPrice, TokenPrices } from "../state";

export const useTotalSupply = (tokenPrices: TokenPrices): string => {
  const {data} = useQuery<PoolsTotalSupply>(POOLS_TOTAL_VALUE_LOCKED);

  if (!data || data.pool_event.length === 0) {
    return "0";
  }

  return data.pool_event.reduce((acc, {reserved_1, reserved_2, pool: {token_1, token_2}}) => {
    const tokenPrice1 = getTokenPrice(token_1, tokenPrices)
    const tokenPrice2 = getTokenPrice(token_2, tokenPrices)
    const r1 = tokenPrice1.multipliedBy(new BigNumber(reserved_1).div(new BigNumber(10).pow(18)));
    const r2 = tokenPrice2.multipliedBy(new BigNumber(reserved_2).div(new BigNumber(10).pow(18)));
    return acc.plus(r1).plus(r2);
  }, new BigNumber(0)).toString();
}

export const usePoolVolume = (tokenPrices: TokenPrices): string => {
  const fromTime = useMemo(
    () => new Date(Date.now() - 24*60*60*1000).toISOString(),
    []
  );
  const {data} = useQuery<Pool24HVolume, PoolVolume24HVar>(
    POOL_24H_VOLUME,
    {
      variables: { fromTime }
    }
  );
  if (!data || data.pool_hour_volume.length === 0) {
    return "0";
  }
  
  return data.pool_hour_volume.reduce((acc, {amount_1, amount_2, pool: {token_1, token_2}}) => {
    const tokenPrice1 = getTokenPrice(token_1, tokenPrices);
      const tokenPrice2 = getTokenPrice(token_2, tokenPrices);

    return acc
      .plus(tokenPrice1.multipliedBy(new BigNumber(amount_1).div(new BigNumber(10).pow(18))))
      .plus(tokenPrice2.multipliedBy(new BigNumber(amount_2).div(new BigNumber(10).pow(18))));
  }, new BigNumber(0)).toString();
};

