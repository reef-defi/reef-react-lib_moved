import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { graphql } from '@reef-chain/util-lib';
import {
  PoolBasicTransactionVar,
 POOL_CURRENT_RESERVES_GQL, POOL_DAY_FEE_QUERY_GQL, POOL_DAY_TVL_GQL,
  POOL_DAY_VOLUME_GQL, POOL_FEES_GQL, POOL_GQL, POOL_SUPPLY_GQL, POOL_TRANSACTIONS_GQL, POOL_TRANSACTION_COUNT_GQL,
  POOL_VOLUME_AGGREGATE_GQL, TransactionTypes,
} from '../graphql/pools';
import useInterval from './userInterval';
import { POLL_INTERVAL } from '../utils';
import { graphqlRequest } from '../graphql/gqlUtils';

export const getPoolVolumeAggregateQuery = (address:string,
  fromTime:string,
  toTime:string) => ({
  query: POOL_VOLUME_AGGREGATE_GQL,
  variables: { address, fromTime, toTime },
});

export const getPoolSupplyQuery = (address:string) => ({
  query: POOL_SUPPLY_GQL,
  variables: { address },
});

export const getPoolFeesQuery = (address:string,fromTime:string) => ({
  query: POOL_FEES_GQL,
  variables: { address,fromTime },
});

export const getPoolQuery = (address:string) => ({
  query: POOL_GQL,
  variables: { address },
});

export const getCurrentReservesQuery = (address:string) => ({
  query: POOL_CURRENT_RESERVES_GQL,
  variables: { address },
});

// Intermediate query hooks
export const useDayVolume = async (
  address: string,
  fromTime: string,
  toTime: string,
): Promise<AxiosResponse> => {
  const queryObj = getPoolVolumeAggregateQuery(address, fromTime, toTime);
  const response = await graphqlRequest(axios, queryObj);
  return response.data;
};
//  useQuery<PoolVolumeAggregateQuery, PoolVolumeAggregateVar>(
//   POOL_VOLUME_AGGREGATE_GQL,
//   {
//     variables: {
//       address,
//       fromTime,
//       toTime,
//     },
//   },
// );

export const useCurrentPoolSupply = async (
  address: string,
): Promise<AxiosResponse> => {
  const queryObj = getPoolSupplyQuery(address);
  const response = await graphqlRequest(axios, queryObj);
  return response.data;
};
//  useQuery<PoolSupplyQuery, PoolSupplyVar>(POOL_SUPPLY_GQL, {
//   variables: { address },
// });

export const useDayFee = async(
  address: string,
  fromTime: string,
): Promise<AxiosResponse>=> {
  const queryObj = getPoolFeesQuery(address,fromTime);
  const response = await graphqlRequest(axios, queryObj);
  return response.data;
}
// useQuery<PoolFeeQuery, PoolFeeVar>(POOL_FEES_GQL, {
//   variables: { address, fromTime },
// });

export const usePoolQuery =async (address: string): Promise<AxiosResponse> => {
  const queryObj = getPoolQuery(address);
  const response = await graphqlRequest(axios, queryObj);
  return response.data;
}
// useQuery<PoolQuery, PoolVar>(POOL_GQL, {
//   variables: { address },
// });

export const useCurrentPoolReserve = async(
  address: string,
): Promise<AxiosResponse> => {
  const queryObj = getCurrentReservesQuery(address);
  const response = await graphqlRequest(axios, queryObj);
  return response.data;
}
// useQuery<PoolReservesQuery, PoolReservesVar>(POOL_CURRENT_RESERVES_GQL, {
//   variables: { address },
// });

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

export const getPoolTransactionCountQuery = (address: string|undefined, type:TransactionTypes) => ({
  query: POOL_TRANSACTION_COUNT_GQL,
  variables: resolveTransactionVariables(address, type),
});

export const getPoolDayTvlQuery = (address: string, fromTime:string) => ({
  query: POOL_DAY_TVL_GQL,
  variables: {address, fromTime},
});
export const getPoolDayVolumeQuery = (address: string, fromTime:string) => ({
  query: POOL_DAY_VOLUME_GQL,
  variables: {address, fromTime},
});
export const getPoolDayFeeQuery = (address: string, fromTime:string) => ({
  query: POOL_DAY_FEE_QUERY_GQL,
  variables: {address, fromTime},
});

export const getPoolTransactionQuery = (address: string|undefined, type:TransactionTypes, limit:number, pageIndex:number) => ({
  query: POOL_TRANSACTIONS_GQL,
  variables: {
    ...resolveTransactionVariables(address, type),
    limit,
    offset: pageIndex * limit,
  },
});

export const usePoolTransactionCountSubscription = async (
  address: string | undefined,
  type: TransactionTypes,
  httpClient: AxiosInstance,
): Promise<any> => {
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

export const usePoolTransactionSubscription = async (
  address: string | undefined,
  type: TransactionTypes,
  pageIndex = 0,
  limit = 10,
  httpClient: AxiosInstance,
): Promise<any> => {
  const queryObj = getPoolTransactionQuery(address, type, limit, pageIndex);
  const response = await graphqlRequest(httpClient, queryObj);
  return graphql.queryGql$(response.data);
};

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

export const useDayTvl =async (
  address: string,
  fromTime: number,
): Promise<AxiosResponse> => {
  const queryObj = getPoolDayTvlQuery(address, new Date(fromTime).toISOString());
  const response = await graphqlRequest(axios, queryObj);
  return graphql.queryGql$(response.data);
}
// useQuery<PoolDayTvlQuery, PoolDayTvlVar>(POOL_DAY_TVL_GQL, {
//   variables: {
//     address,
//     fromTime: new Date(fromTime).toISOString(),
//   },
// });

export const useDayPoolVolume =async (
  address: string,
  fromTime: number,
): Promise<AxiosResponse> => {
  const queryObj = getPoolDayVolumeQuery(address, new Date(fromTime).toISOString());
  const response = await graphqlRequest(axios, queryObj);
  return graphql.queryGql$(response.data);
}
// useQuery<PoolDayVolumeQuery, PoolVolumeVar>(POOL_DAY_VOLUME_GQL, {
  //   variables: {
    //     address,
    //     fromTime: new Date(fromTime).toISOString(),
    //   },
    // });
    
    export const useDayPoolFee = async(
      address: string,
      fromTime: number,
      ): Promise<AxiosResponse> =>{
        const queryObj = getPoolDayFeeQuery(address, new Date(fromTime).toISOString());
        const response = await graphqlRequest(axios, queryObj);
        return graphql.queryGql$(response.data);
        
}

//  useQuery<PoolDayFeeQuery, PoolDayFeeVar>(
//   POOL_DAY_FEE_QUERY_GQL,
//   {
//     variables: {
//       address,
//       fromTime: new Date(fromTime).toISOString(),
//     },
//   },
// );
