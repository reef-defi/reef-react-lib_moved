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

  // TODO: store icons in Pool table
  const pools = data?.allPools.map((pool) => {
    return {
      ...pool,
      icon1: getIconUrl(pool.token1),
      icon2: getIconUrl(pool.token2),
    };
  });

  return pools || [];
};
