import {
  QueryResult, SubscriptionResult, useQuery,
  useSubscription,
} from '@apollo/client';
import {
  PoolBasicTransactionVar, PoolCountQuery, PoolCountVar, PoolDayCandlestickQuery,
  PoolDayCandlestickVar, PoolDayFeeQuery, PoolDayVolumeQuery, PoolFeeQuery,
  PoolFeeVar, PoolHourFeeVar, PoolQuery, PoolReservesQuery, PoolReservesVar, PoolsQuery, PoolSupplyQuery, PoolSupplyVar, PoolsVar, POOLS_GQL, PoolTransactionCountQuery, PoolTransactionQuery,
  PoolTransactionVar, PoolTvlQuery,
  PoolTvlVar, PoolVar, PoolVolumeAggregateQuery,
  PoolVolumeAggregateVar, PoolVolumeVar, POOL_COUNT_GQL, POOL_CURRENT_RESERVES_GQL, POOL_DAY_CANDLESTICK_GQL, POOL_DAY_FEE_QUERY_GQL, POOL_DAY_TVL_GQL, POOL_DAY_VOLUME_GQL, POOL_FEES_GQL, POOL_GQL, POOL_LAST_CANDLESTICH_GQL, POOL_SUPPLY_GQL, POOL_TRANSACTIONS_GQL, POOL_TRANSACTION_COUNT_GQL, POOL_VOLUME_AGGREGATE_GQL,
  TransactionTypes,
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

export const useDayTvl = (
  address: string,
  fromTime: number,
): QueryResult<PoolTvlQuery> => useQuery<PoolTvlQuery, PoolTvlVar>(POOL_DAY_TVL_GQL, {
  variables: {
    address,
    fromTime: new Date(fromTime).toISOString(),
  },
});
export const useDayPoolVolume = (
  address: string,
  fromTime: number,
): QueryResult<PoolDayVolumeQuery> => useQuery<PoolDayVolumeQuery, PoolVolumeVar>(POOL_DAY_VOLUME_GQL, {
  variables: {
    address,
    fromTime: new Date(fromTime).toISOString(),
  },
});

export const useDayCandlestick = (
  address: string,
  fromTime: number,
  whichToken: number,
): QueryResult<PoolDayCandlestickQuery> => useQuery<PoolDayCandlestickQuery, PoolDayCandlestickVar>(
  POOL_DAY_CANDLESTICK_GQL,
  {
    variables: {
      address,
      whichToken,
      fromTime: new Date(fromTime).toISOString(),
    },
  },
);

export const useLastDayCandlestick = (
  address: string,
  fromTime: number,
  whichToken: number,
): QueryResult<PoolDayCandlestickQuery> => useQuery<PoolDayCandlestickQuery, PoolDayCandlestickVar>(
  POOL_LAST_CANDLESTICH_GQL,
  {
    variables: {
      address,
      whichToken,
      fromTime: new Date(fromTime).toISOString(),
    },
  },
);

export const useDayPoolFee = (
  address: string,
  fromTime: number,
): SubscriptionResult<PoolDayFeeQuery> => useQuery<PoolDayFeeQuery, PoolHourFeeVar>(
  POOL_DAY_FEE_QUERY_GQL,
  {
    variables: {
      address,
      fromTime: new Date(fromTime).toISOString(),
    },
  },
);
