import { useQuery, useSubscription } from "@apollo/client";
import {
  PoolVolumeAggregateQuery,
  PoolVolumeAggregateVar,
  POOL_VOLUME_AGGREGATE_GQL,
  TransactionTypes,
  PoolSupplyQuery,
  POOL_SUPPLY_GQL,
  PoolFeeQuery,
  PoolFeeVar,
  POOL_FEES_GQL,
  PoolQuery,
  POOL_GQL,
  PoolReservesQuery,
  POOL_CURRENT_RESERVES_GQL,
  PoolsQuery,
  PoolVar,
  POOLS_GQL,
  POOL_COUNT_GQL,
  PoolBasicTransactionVar,
  POOL_TRANSACTION_COUNT_GQL,
  PoolTransactionQuery,
  PoolTransactionVar,
  POOL_TRANSACTIONS_GQL,
  PoolCountQuery,
  PoolTransactionCountQuery,
  PoolSupplyVar,
  PoolReservesVar,
  PoolsVar,
  PoolCountVar,
  PoolTvlQuery,
  PoolTvlVar,
  POOL_TVL_GQL,
  PoolHourVolumeQuery,
  PoolHourVolumeVar,
  POOL_HOUR_VOLUME_GQL,
  PoolHourCandlestickQuery,
  PoolHourCandlestickVar,
  POOL_HOUR_CANDLESTICK_GQL,
  PoolHourFeeQuery,
  PoolHourFeeVar,
  POOL_HOUR_FEE_SUBSCRIPTION_GQL,
} from "../graphql/pools";

// Intermediat query hooks
export const useDayVolume = (
  address: string,
  fromTime: string,
  toTime: string
) =>
  useQuery<PoolVolumeAggregateQuery, PoolVolumeAggregateVar>(POOL_VOLUME_AGGREGATE_GQL, {
    variables: {
      address,
      fromTime,
      toTime,
    },
  });
export const useCurrentPoolSupply = (address: string) =>
  useQuery<PoolSupplyQuery, PoolSupplyVar>(POOL_SUPPLY_GQL, {
    variables: { address },
  });
export const useDayFee = (address: string, fromTime: string) =>
  useQuery<PoolFeeQuery, PoolFeeVar>(POOL_FEES_GQL, {
    variables: { address, fromTime },
  });
export const usePoolQuery = (address: string) =>
  useQuery<PoolQuery, PoolVar>(POOL_GQL, {
    variables: { address },
  });

export const useCurrentPoolReserve = (address: string) =>
  useQuery<PoolReservesQuery, PoolReservesVar>(POOL_CURRENT_RESERVES_GQL, {
    variables: { address },
  });

export const usePools = (fromTime: string, offset: number, search?: string) =>
  useQuery<PoolsQuery, PoolsVar>(POOLS_GQL, {
    variables: {
      fromTime,
      offset,
      search: search ? { _ilike: `${search}%` } : {},
    },
  });
export const usePoolCount = (search?: string) =>
  useQuery<PoolCountQuery, PoolCountVar>(POOL_COUNT_GQL, {
    variables: { search: search ? { _ilike: `${search}%` } : {} },
  });

const resolveTransactionVariables = (
  search: string | undefined,
  type: TransactionTypes
): PoolBasicTransactionVar => ({
  search: search ? { _ilike: search } : {},
  type: type === "All" ? ["Swap", "Mint", "Burn"] : [type],
});
export const usePoolTransactionCountSubscription = (
  address: string | undefined,
  type: TransactionTypes
) =>
  useSubscription<PoolTransactionCountQuery, PoolBasicTransactionVar>(
    POOL_TRANSACTION_COUNT_GQL,
    {
      variables: resolveTransactionVariables(address, type),
    }
  );
export const usePoolTransactionSubscription = (
  address: string | undefined,
  type: TransactionTypes,
  pageIndex = 0,
  limit = 10
) =>
  useSubscription<PoolTransactionQuery, PoolTransactionVar>(POOL_TRANSACTIONS_GQL, {
    variables: {
      ...resolveTransactionVariables(address, type),
      limit,
      offset: pageIndex * limit,
    },
  });

export const useHourTvl = (address: string, fromTime: number) => useQuery<PoolTvlQuery, PoolTvlVar>(
  POOL_TVL_GQL,
  {
    variables: {
      address,
      fromTime: new Date(fromTime).toISOString(),
    }
  }
)
export const useHourVolume = (address: string, fromTime: number) => useQuery<PoolHourVolumeQuery, PoolHourVolumeVar>(
  POOL_HOUR_VOLUME_GQL,
  {
    variables: {
      address,
      fromTime: new Date(fromTime).toISOString(),
    }
  }
)

export const useHourCandlestick = (address: string, fromTime: number, whichToken: number) => useQuery<PoolHourCandlestickQuery, PoolHourCandlestickVar>(
  POOL_HOUR_CANDLESTICK_GQL,
  {
    variables: {
      address,
      whichToken,
      fromTime: new Date(fromTime).toISOString(),
    }
  }
)

export const useHourFeeSubscription = (address: string, fromTime: number) => useSubscription<PoolHourFeeQuery, PoolHourFeeVar>(
  POOL_HOUR_FEE_SUBSCRIPTION_GQL,
  {
    variables: {
      address,
      fromTime: new Date(fromTime).toISOString(),
    }
  }
)
