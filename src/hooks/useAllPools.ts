import { ApolloClient, useQuery } from '@apollo/client';
import { AllPoolsQuery, ALL_POOLS } from '../graphql/pools';
import { POLL_INTERVAL, getIconUrl } from '../utils';
import useInterval from './userInterval';
import { PoolWithReserves } from '../state';

export const useAllPools = (dexClient: ApolloClient<any>): PoolWithReserves[] => {
  const { data, refetch } = useQuery<AllPoolsQuery>(
    ALL_POOLS,
    { client: dexClient, }
  );

  useInterval(() => {
    refetch();
  }, POLL_INTERVAL);

  const pools = data?.allPools.map((pool) => {
    return {
      ...pool,
      iconUrl1: pool.iconUrl1 === '' ? getIconUrl(pool.token1) : pool.iconUrl1,
      iconUrl2: pool.iconUrl2 === '' ? getIconUrl(pool.token2) : pool.iconUrl2,
    };
  });

  return pools || [];
};
