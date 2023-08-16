import {
  QueryResult, SubscriptionResult, useQuery
} from '@apollo/client';
import {
  PoolBasicTransactionVar, PoolDayFeeQuery, PoolDayVolumeQuery, PoolFeeQuery, PoolFeeVar, PoolDayFeeVar,
  PoolQuery, PoolReservesQuery, PoolReservesVar, PoolSupplyQuery, PoolSupplyVar, PoolTransactionCountQuery,
 PoolDayTvlQuery, PoolDayTvlVar, PoolVar, PoolVolumeAggregateQuery,
  PoolVolumeAggregateVar, PoolVolumeVar, POOL_CURRENT_RESERVES_GQL, POOL_DAY_FEE_QUERY_GQL, POOL_DAY_TVL_GQL,
  POOL_DAY_VOLUME_GQL, POOL_FEES_GQL, POOL_GQL, POOL_SUPPLY_GQL, POOL_TRANSACTIONS_GQL, POOL_TRANSACTION_COUNT_GQL,
  POOL_VOLUME_AGGREGATE_GQL, TransactionTypes,
} from '../graphql/pools';
import useInterval from './userInterval';
import { POLL_INTERVAL } from '../utils';
import { AxiosInstance } from 'axios';
import { graphqlRequest } from '../graphql/gqlUtils';
import {graphql} from '@reef-chain/util-lib';

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

export const getPoolTransactionCountQuery = (address: string|undefined,type:TransactionTypes) => {
  return {
    query: POOL_TRANSACTION_COUNT_GQL,
    variables: resolveTransactionVariables(address,type),
  };
};

export const getPoolTransactionQuery = (address: string|undefined,type:TransactionTypes,limit:number,pageIndex:number) => {
  return {
    query: POOL_TRANSACTIONS_GQL,
    variables: {
      ...resolveTransactionVariables(address, type),
      limit,
      offset: pageIndex * limit,
    },
  };
};

export const usePoolTransactionCountSubscription = async (
  address: string | undefined,
  type: TransactionTypes,
  httpClient: AxiosInstance,
): Promise<QueryResult<PoolTransactionCountQuery>> => {
  if (httpClient === undefined) {
    return [undefined, true] as any;
  }

  const queryObj = getPoolTransactionCountQuery(address, type);
  const response = await graphqlRequest(httpClient, queryObj);

  const { data, loading, refetch } = response.data;

  useInterval(() => {
    refetch();
  }, POLL_INTERVAL);

  return [data, loading] as any;
};

export const usePoolTransactionSubscription = async(
  address: string | undefined,
  type: TransactionTypes,
  pageIndex = 0,
  limit = 10,
  httpClient: AxiosInstance,
): Promise<any> => {
  const queryObj = getPoolTransactionQuery(address,type,limit,pageIndex);
  const response = await graphqlRequest(httpClient, queryObj);
  return graphql.queryGql$(response.data);
}

// useSubscription<PoolTransactionQuery, PoolTransactionVar>(
//   POOL_TRANSACTIONS_GQL,
//   {
//     client: dexClient,
//     variables: {
//       ...resolveTransactionVariables(address, type),
//       limit,
//       offset: pageIndex * limit,
//     },
//   },
// );

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
