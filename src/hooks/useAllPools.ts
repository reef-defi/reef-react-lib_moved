import { useSubscription } from '@apollo/client';
import { AllPoolSubscription, ALL_POOL_SUBSCRIPTION } from '../graphql/pools';
import { LastPoolReserves } from '../state';

export const useAllPools = (): LastPoolReserves[] => {
  const { data } = useSubscription<AllPoolSubscription>(ALL_POOL_SUBSCRIPTION);
  return data
    ? data.poolEvent.map(
      ({
        id,
        reserved1,
        reserved2,
        token1,
        token2,
        decimal1,
        decimal2,
        symbol1,
        symbol2
      }) => ({
        id,
        token1,
        token2,
        reserved1,
        reserved2,
        symbol1,
        symbol2,
        decimal1,
        decimal2,
      }),
    )
    : [];
};
