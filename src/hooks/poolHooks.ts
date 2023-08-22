import {
  QueryResult, SubscriptionResult, useQuery,
} from '@apollo/client';
import {
  PoolBasicTransactionVar, PoolDayFeeQuery, PoolDayVolumeQuery, PoolFeeQuery, PoolFeeVar, PoolDayFeeVar,
  PoolQuery, PoolReservesQuery, PoolSupplyQuery, PoolSupplyVar, PoolTransactionCountQuery,
  PoolTransactionQuery, PoolDayTvlQuery, PoolDayTvlVar, PoolVar, PoolVolumeAggregateQuery,
   PoolVolumeVar, POOL_CURRENT_RESERVES_GQL, POOL_DAY_FEE_QUERY_GQL, POOL_DAY_TVL_GQL,
  POOL_DAY_VOLUME_GQL, POOL_FEES_GQL, POOL_GQL, POOL_SUPPLY_GQL, POOL_TRANSACTIONS_GQL, POOL_TRANSACTION_COUNT_GQL,
  POOL_VOLUME_AGGREGATE_GQL, TransactionTypes,
} from '../graphql/pools';
import useInterval from './userInterval';
import { POLL_INTERVAL } from '../utils';
import axios, { AxiosInstance } from 'axios';
import {  useEffect, useState } from 'react';
import { graphqlRequest } from './useAllPools';

const getPoolVolumeAggregateQuery = (address: string,
  fromTime: string,
  toTime: string) => ({
  query: POOL_VOLUME_AGGREGATE_GQL,
  variables: {
    address,
    fromTime,
    toTime,
  },
});

// Intermediate query hooks
export const useDayVolume = (
  address: string,
  fromTime: string,
  toTime: string,
): PoolVolumeAggregateQuery => {
  const [data, setData] = useState<PoolVolumeAggregateQuery|undefined>()
  const poolCurrReservesQry = getPoolVolumeAggregateQuery(address,fromTime,toTime);
  useEffect(()=>{
    const handleResponse = async()=>{
      const response = await graphqlRequest(axios,poolCurrReservesQry);
      setData(response.data);
    }
    handleResponse();
  },[]);

  return data as any;
}

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
): PoolReservesQuery =>{ 
  const [data, setData] = useState<PoolReservesQuery|undefined>()
  const poolCurrReservesQry = getPoolCurrentReservesQry(address);
  useEffect(()=>{
    const handleResponse = async()=>{
      const response = await graphqlRequest(axios,poolCurrReservesQry);
      setData(response.data);
    }
    handleResponse();
  },[]);

  return data as any;
}

const resolveTransactionVariables = (
  search: string | undefined,
  type: TransactionTypes,
): PoolBasicTransactionVar => ({
  search: search || '',
  type: type === 'All' ? ['Swap', 'Mint', 'Burn'] : [type],
});

const getPoolTransactionCountQry =(address: string | undefined, type: TransactionTypes) => ({
  query: POOL_TRANSACTION_COUNT_GQL,
  variables: resolveTransactionVariables(address, type),
});

const getPoolCurrentReservesQry =(address: string) => ({
  query: POOL_CURRENT_RESERVES_GQL,
  variables: {address},
});

const getPoolTransactionQry = (address: string | undefined, type: TransactionTypes, limit: number, pageIndex: number): {query: string, variables: any} => ({
  query: POOL_TRANSACTIONS_GQL,
  variables: {
    ...resolveTransactionVariables(address, type),
    limit,
    offset: pageIndex * limit,
  },
});


export const usePoolTransactionCountSubscription = (
  address: string | undefined,
  type: TransactionTypes,
  httpClient: AxiosInstance,
): QueryResult<PoolTransactionCountQuery> => {
  const [data,setData]= useState<PoolTransactionCountQuery|undefined>();
  const [loading,setLoading] = useState<boolean>(true);
  if (httpClient === undefined) {
    return [undefined, true] as any;
  }
  const queryObj = getPoolTransactionCountQry(address, type);
  useInterval(async() => {
    setLoading(true);
    const response = await graphqlRequest(httpClient, queryObj);
    setData(response.data);
    setLoading(false);
  }, POLL_INTERVAL);

  return [data, loading] as any;
};

export const usePoolTransactionSubscription = (
  address: string | undefined,
  type: TransactionTypes,
  pageIndex = 0,
  limit = 10,
  httpClient: AxiosInstance,
): SubscriptionResult<PoolTransactionQuery> => {
  const [data,setData]= useState<PoolTransactionQuery|undefined>();
  const [loading,setLoading] = useState<boolean>(true);
  if (httpClient === undefined) {
    return [undefined, true] as any;
  }
  const queryObj = getPoolTransactionQry(address, type, limit, pageIndex);

  useInterval(async() => {
    setLoading(true);
    const response = await graphqlRequest(httpClient, queryObj);
    setData(response.data);
    setLoading(false);
  }, POLL_INTERVAL);

  return [data, loading] as any;
  }

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
