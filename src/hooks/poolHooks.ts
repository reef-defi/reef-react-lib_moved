import {
  ApolloClient,
  QueryResult, SubscriptionResult, useQuery,
  useSubscription,
} from '@apollo/client';
import {
  PoolBasicTransactionVar, PoolDayFeeQuery, PoolDayVolumeQuery, PoolFeeQuery, PoolFeeVar, PoolDayFeeVar, 
  PoolQuery, PoolReservesQuery, PoolReservesVar, PoolSupplyQuery, PoolSupplyVar, PoolTransactionCountQuery, 
  PoolTransactionQuery, PoolTransactionVar, PoolDayTvlQuery, PoolDayTvlVar, PoolVar, PoolVolumeAggregateQuery,
  PoolVolumeAggregateVar, PoolVolumeVar, POOL_CURRENT_RESERVES_GQL, POOL_DAY_FEE_QUERY_GQL, POOL_DAY_TVL_GQL, 
  POOL_DAY_VOLUME_GQL, POOL_FEES_GQL, POOL_GQL, POOL_SUPPLY_GQL, POOL_TRANSACTIONS_GQL, POOL_TRANSACTION_COUNT_GQL, 
  POOL_VOLUME_AGGREGATE_GQL, TransactionTypes,
} from '../graphql/pools';
import useInterval from './userInterval';
import { POLL_INTERVAL } from '../utils';

// Intermediate query hooks
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

// export const usePools = (
//   fromTime: string,
//   offset: number,
//   search?: string,
// ): QueryResult<PoolsQuery> => useQuery<PoolsQuery, PoolsVar>(POOLS_GQL, {
//   variables: {
//     fromTime,
//     offset,
//     search: search || '',
//   },
// });

// export const usePoolCount = (search?: string): QueryResult<PoolCountQuery> => useQuery<PoolCountQuery, PoolCountVar>(POOL_COUNT_GQL, {
//   variables: { search: search ? { _ilike: `${search}%` } : {} },
// });

const resolveTransactionVariables = (
  search: string | undefined,
  type: TransactionTypes,
): PoolBasicTransactionVar => ({
  search: search || '',
  type: type === 'All' ? ['Swap', 'Mint', 'Burn'] : [type],
});
export const usePoolTransactionCountSubscription = (
  address: string | undefined,
  type: TransactionTypes,
  dexClient: ApolloClient<any>,
): QueryResult<PoolTransactionCountQuery> => {
  if (dexClient === undefined) {
    return [undefined, true] as any;
  };

  const { data, loading, refetch } = useQuery<PoolTransactionCountQuery, PoolBasicTransactionVar>(
    POOL_TRANSACTION_COUNT_GQL, 
    {
      client: dexClient,
      variables: resolveTransactionVariables(address, type),
    }
  );

  useInterval(() => {
    refetch();
  }, POLL_INTERVAL);

  return [data, loading] as any;
}
export const usePoolTransactionSubscription = (
  address: string | undefined,
  type: TransactionTypes,
  pageIndex = 0,
  limit = 10,
  dexClient: ApolloClient<any>,
): SubscriptionResult<PoolTransactionQuery> => useSubscription<PoolTransactionQuery, PoolTransactionVar>(
  POOL_TRANSACTIONS_GQL,
  {
    client: dexClient,
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
): QueryResult<PoolDayTvlQuery> => useQuery<PoolDayTvlQuery, PoolDayTvlVar>(POOL_DAY_TVL_GQL, {
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

export const useDayPoolFee = (
  address: string,
  fromTime: number,
): SubscriptionResult<PoolDayFeeQuery> => useQuery<PoolDayFeeQuery, PoolDayFeeVar>(
  POOL_DAY_FEE_QUERY_GQL,
  {
    variables: {
      address,
      fromTime: new Date(fromTime).toISOString(),
    },
  },
);
