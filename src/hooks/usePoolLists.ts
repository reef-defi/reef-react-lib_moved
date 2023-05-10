import { ApolloClient, useQuery } from '@apollo/client';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { AllPoolsListCountQuery, AllPoolsListQuery, ALL_POOLS_LIST, ALL_POOLS_LIST_COUNT, PoolListItem, PoolsListCountVar, PoolsListVar, UserPoolsListCountQuery, UserPoolsListQuery, USER_POOLS_LIST, USER_POOLS_LIST_COUNT } from '../graphql/pools';
import { TokenPrices } from '../state';
import { getIconUrl } from '../utils';

interface PoolItem {
  address: string;
  tvl: string;
  volume24h: string;
  volumeChange24h: number;
  myLiquidity?: string;
  token1: {
    name: string;
    image: string;
  };
  token2: {
    name: string;
    image: string;
  };
}

interface UsePoolsList extends PoolsListVar {
  tokenPrices: TokenPrices;
  dexClient: ApolloClient<any>;
  queryType: 'All' | 'User';
}

const calculate24hVolumeUSD = ({
    token1,
    token2,
    dayVolume1,
    dayVolume2,
    prevDayVolume1,
    prevDayVolume2,
    decimal1,
    decimal2,
  }: PoolListItem,
  tokenPrices: TokenPrices,
  current: boolean,
): BigNumber => {
  const v1 = current ? dayVolume1 : prevDayVolume1;
  const v2 = current ? dayVolume2 : prevDayVolume2;
  if (v1 === null && v2 === null) return new BigNumber(0);
  const dv1 = new BigNumber(v1 === null ? 0 : v1)
    .div(new BigNumber(10).pow(decimal1))
    .multipliedBy(tokenPrices[token1]);
  const dv2 = new BigNumber(v2 === null ? 0 : v2)
    .div(new BigNumber(10).pow(decimal2))
    .multipliedBy(tokenPrices[token2]);

  return dv1.plus(dv2);
};

const calculateVolumeChange = (pool: PoolListItem, tokenPrices: TokenPrices): number => {
  const current = calculate24hVolumeUSD(pool, tokenPrices, true);
  const previous = calculate24hVolumeUSD(pool, tokenPrices, false);
  if (previous.eq(0) && current.eq(0)) return 0;
  if (previous.eq(0)) return 100;
  if (current.eq(0)) return -100;
  const res = current.minus(previous).div(previous).multipliedBy(100);
  return res.toNumber();
};

const calculateUSDTVL = ({
  reserved1,
  reserved2,
  decimal1,
  decimal2,
  token1,
  token2,
}: PoolListItem,
tokenPrices: TokenPrices): string => {
  const r1 = new BigNumber(reserved1).div(new BigNumber(10).pow(decimal1)).multipliedBy(tokenPrices[token1] || 0);
  const r2 = new BigNumber(reserved2).div(new BigNumber(10).pow(decimal2)).multipliedBy(tokenPrices[token2] || 0);
  const result = r1.plus(r2).toFormat(2);
  return result === 'NaN' ? '0' : result;
};

const calculateUserLiquidity = (
  {
    token1, token2, userLockedAmount1, userLockedAmount2, decimal1, decimal2,
  }: PoolListItem,
  tokenPrices: TokenPrices,
): string|undefined => {
  const v1 = new BigNumber(userLockedAmount1 === null ? '0' : userLockedAmount1)
    .div(new BigNumber(10).pow(decimal1))
    .multipliedBy(tokenPrices[token1]);
  const v2 = new BigNumber(userLockedAmount2 === null ? '0' : userLockedAmount2)
    .div(new BigNumber(10).pow(decimal2))
    .multipliedBy(tokenPrices[token2]);
  const res = v1.plus(v2);

  return res.gt(0) ? res.toFormat(2) : undefined;
};

export const usePoolsList = ({
  limit, offset, search, signerAddress, tokenPrices, queryType, dexClient
}: UsePoolsList): [PoolItem[], boolean, number] => {

  const { data: dataPoolsList, loading: loadingPoolsList } = useQuery<AllPoolsListQuery | UserPoolsListQuery, PoolsListVar>(
    queryType === 'User' ? USER_POOLS_LIST : ALL_POOLS_LIST,
    {
      client: dexClient,
      variables: { limit, offset, search, signerAddress },
    },
  );

  const { data: dataPoolsCount, loading: loadingPoolsCount } = useQuery<AllPoolsListCountQuery | UserPoolsListCountQuery, PoolsListCountVar>(
    queryType === 'User' ? USER_POOLS_LIST_COUNT : ALL_POOLS_LIST_COUNT,
    {
      client: dexClient,
      variables: { search, signerAddress },
    },
  );

  const processed = useMemo((): PoolItem[] => {
    if (!dataPoolsList) return [];
    const poolsList = queryType === 'User' 
      ? (dataPoolsList as UserPoolsListQuery).userPoolsList 
      : (dataPoolsList as AllPoolsListQuery).allPoolsList;
    return poolsList.map((pool) => ({
      address: pool.id,
      token1: {
        image: getIconUrl(pool.token1),
        name: pool.name1,
      },
      token2: {
        image: getIconUrl(pool.token2),
        name: pool.name2,
      },
      tvl: calculateUSDTVL(pool, tokenPrices),
      volume24h: calculate24hVolumeUSD(pool, tokenPrices, true).toFormat(2),
      volumeChange24h: calculateVolumeChange(pool, tokenPrices),
      myLiquidity: calculateUserLiquidity(pool, tokenPrices),
    })); 
  }, [dataPoolsList]);

  return [
    processed, 
    loadingPoolsList || loadingPoolsCount, 
    dataPoolsCount 
      ? queryType === 'User' 
          ? (dataPoolsCount as UserPoolsListCountQuery).userPoolsListCount
          : (dataPoolsCount as AllPoolsListCountQuery).allPoolsListCount
      : 0
  ];
}