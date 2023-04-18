import { useQuery } from '@apollo/client';
import { AllPool, AllPoolsQuery, ALL_POOLS } from '../graphql/pools';
import { POLL_INTERVAL } from '../utils';
import useInterval from './userInterval';

export const useAllPools = (): AllPool[] => {
  const { data, refetch } = useQuery<AllPoolsQuery>(ALL_POOLS);

  useInterval(() => {
    refetch();
  }, POLL_INTERVAL);

  return data?.allPools || [];
};
