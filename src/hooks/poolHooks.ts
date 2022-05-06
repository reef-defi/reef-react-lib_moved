import {
  useQuery,
  useSubscription,
  SubscriptionResult,
  QueryResult,
} from '@apollo/client';
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
} from '../graphql/pools';

// Intermediat query hooks
export const useDayVolume = (
  address: string,
  fromTime: string,
  toTime: string,
): QueryResult<PoolVolumeAggregateQuery> => useQuery<PoolVolumeAggregateQuery, PoolVolumeAggregateVar>(
  POOL_VOLUME_AGGREGATE_GQL,
  {
    variables: {
      address,
      fromTime,
      toTime,
    },
  },
);
export const useCurrentPoolSupply = (
  address: string,
): QueryResult<PoolSupplyQuery> => useQuery<PoolSupplyQuery, PoolSupplyVar>(POOL_SUPPLY_GQL, {
  variables: { address },
});
export const useDayFee = (
  address: string,
  fromTime: string,
): QueryResult<PoolFeeQuery> => useQuery<PoolFeeQuery, PoolFeeVar>(POOL_FEES_GQL, {
  variables: { address, fromTime },
});
export const usePoolQuery = (address: string): QueryResult<PoolQuery> => useQuery<PoolQuery, PoolVar>(POOL_GQL, {
  variables: { address },
});

export const useCurrentPoolReserve = (
  address: string,
): QueryResult<PoolReservesQuery> => useQuery<PoolReservesQuery, PoolReservesVar>(POOL_CURRENT_RESERVES_GQL, {
  variables: { address },
});

export const usePools = (
  fromTime: string,
  offset: number,
  search?: string,
): QueryResult<PoolsQuery> => useQuery<PoolsQuery, PoolsVar>(POOLS_GQL, {
  variables: {
    fromTime,
    offset,
    search: search ? { _ilike: `${search}%` } : {},
  },
});
export const usePoolCount = (search?: string): QueryResult<PoolCountQuery> => useQuery<PoolCountQuery, PoolCountVar>(POOL_COUNT_GQL, {
  variables: { search: search ? { _ilike: `${search}%` } : {} },
});

const resolveTransactionVariables = (
  search: string | undefined,
  type: TransactionTypes,
): PoolBasicTransactionVar => ({
  search: search ? { _ilike: search } : {},
  type: type === 'All' ? ['Swap', 'Mint', 'Burn'] : [type],
});
export const usePoolTransactionCountSubscription = (
  address: string | undefined,
  type: TransactionTypes,
): SubscriptionResult<PoolTransactionCountQuery> => useSubscription<PoolTransactionCountQuery, PoolBasicTransactionVar>(
  POOL_TRANSACTION_COUNT_GQL,
  {
    variables: resolveTransactionVariables(address, type),
  },
);
export const usePoolTransactionSubscription = (
  address: string | undefined,
  type: TransactionTypes,
  pageIndex = 0,
  limit = 10,
): SubscriptionResult<PoolTransactionQuery> => useSubscription<PoolTransactionQuery, PoolTransactionVar>(
  POOL_TRANSACTIONS_GQL,
  {
    variables: {
      ...resolveTransactionVariables(address, type),
      limit,
      offset: pageIndex * limit,
    },
  },
);

export const useHourTvl = (
  address: string,
  fromTime: number,
): QueryResult<PoolTvlQuery> => useQuery<PoolTvlQuery, PoolTvlVar>(POOL_TVL_GQL, {
  variables: {
    address,
    fromTime: new Date(fromTime).toISOString(),
  },
});
export const useHourVolume = (
  address: string,
  fromTime: number,
): QueryResult<PoolHourVolumeQuery> => useQuery<PoolHourVolumeQuery, PoolHourVolumeVar>(POOL_HOUR_VOLUME_GQL, {
  variables: {
    address,
    fromTime: new Date(fromTime).toISOString(),
  },
});

export const useHourCandlestick = (
  address: string,
  fromTime: number,
  whichToken: number,
): QueryResult<PoolHourCandlestickQuery> => useQuery<PoolHourCandlestickQuery, PoolHourCandlestickVar>(
  POOL_HOUR_CANDLESTICK_GQL,
  {
    variables: {
      address,
      whichToken,
      fromTime: new Date(fromTime).toISOString(),
    },
  },
);

export const useHourFeeSubscription = (
  address: string,
  fromTime: number,
): SubscriptionResult<PoolHourFeeQuery> => useSubscription<PoolHourFeeQuery, PoolHourFeeVar>(
  POOL_HOUR_FEE_SUBSCRIPTION_GQL,
  {
    variables: {
      address,
      fromTime: new Date(fromTime).toISOString(),
    },
  },
);
