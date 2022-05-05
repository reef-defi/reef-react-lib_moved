import { gql, useQuery, useSubscription } from "@apollo/client";
import { VolumeQuery, VolumeVar, POOL_VOLUME_GQL, TransactionTypes, SupplyQuery, AddressVar, POOL_SUPPLY_GQL, FeeQuery, FeeVar, POOL_FEES_GQL, PoolQuery, POOL_GQL, ReservesQuery, POOL_CURRENT_RESERVES_GQL, PoolsQuery, PoolVar, POOLS_GQL, OptionalSearchVar, POOL_COUNT_GQL, BasicTransactionVar, POOL_TRANSACTION_COUNT_GQL, PoolTransactionQuery, TransactionVar, POOL_TRANSACTIONS_GQL, PoolCountQuery, PoolTransactionCountQuery } from "../graphql/pools";


// Intermediat query hooks
export const useDayVolume = (
  address: string,
  fromTime: string,
  toTime: string
) =>
  useQuery<VolumeQuery, VolumeVar>(POOL_VOLUME_GQL, {
    variables: {
      address,
      fromTime,
      toTime,
    },
  });
export const useCurrentPoolSupply = (address: string) =>
  useQuery<SupplyQuery, AddressVar>(POOL_SUPPLY_GQL, {
    variables: { address },
  });
export const useDayFee = (address: string, fromTime: string) =>
  useQuery<FeeQuery, FeeVar>(POOL_FEES_GQL, {
    variables: { address, fromTime },
  });
export const usePoolQuery = (address: string) =>
  useQuery<PoolQuery, AddressVar>(POOL_GQL, {
    variables: { address },
  });

export const useCurrentPoolReserve = (address: string) =>
  useQuery<ReservesQuery, AddressVar>(POOL_CURRENT_RESERVES_GQL, {
    variables: { address },
  });

export const usePools = (fromTime: string, offset: number, search?: string) =>
  useQuery<PoolsQuery, PoolVar>(POOLS_GQL, {
    variables: {
      fromTime,
      offset,
      search: search ? { _ilike: `${search}%` } : {},
    },
  });
export const usePoolCount = (search?: string) =>
  useQuery<PoolCountQuery, OptionalSearchVar>(POOL_COUNT_GQL, {
    variables: { search: search ? { _ilike: `${search}%` } : {} },
  });

const resolveTransactionVariables = (
  address: string | undefined,
  type: TransactionTypes
): BasicTransactionVar => ({
  address: address ? { _ilike: address } : {},
  type: type === "All" ? ["Swap", "Mint", "Burn"] : [type],
});
export const usePoolTransactionCountSubscription = (
  address: string | undefined,
  type: TransactionTypes
) =>
  useSubscription<PoolTransactionCountQuery, BasicTransactionVar>(
    POOL_TRANSACTION_COUNT_GQL,
    {
      variables: resolveTransactionVariables(address, type),
    }
  );
export const usePoolTransactionSubscription = (
  address: string | undefined,
  type: TransactionTypes,
  pageIndex = 0,
  limit = 10
) =>
  useSubscription<PoolTransactionQuery, TransactionVar>(POOL_TRANSACTIONS_GQL, {
    variables: {
      ...resolveTransactionVariables(address, type),
      limit,
      offset: pageIndex * limit,
    },
  });
