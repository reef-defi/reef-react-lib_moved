// import { useQuery } from '@apollo/client';
// import { BigNumber } from 'ethers';
// import {
//   PoolLPQuery, PoolsTotalSupplyQuery, POOLS_TOTAL_SUPPLY, PoolUserLPQuery, PoolUserLpVar, PoolVar, POOL_TOTAL_SUPPLY, POOL_USER_LP, UserPoolsQuery, UserPoolsVar, USER_POOLS,
// } from '../graphql/pools';

// export type PoolsTotalSupply = {[poolAddress: string]: BigNumber};

// export const useQueryUserPool = (signerAddress: string, poolAddress: string): BigNumber => {
//   const { data } = useQuery<PoolUserLPQuery, PoolUserLpVar>(
//     POOL_USER_LP,
//     {
//       variables: {
//         signerAddress,
//         address: poolAddress,
//       },
//     },
//   );
//   return BigNumber.from(data
//     ? data.pool_event_aggregate.aggregate.sum.supply.toLocaleString('fullwide', { useGrouping: false })
//     : 0);
// };

// export const usePoolTotalSupply = (address: string): BigNumber => {
//   const { data } = useQuery<PoolLPQuery, PoolVar>(
//     POOL_TOTAL_SUPPLY,
//     { variables: { address } },
//   );
//   return BigNumber.from(
//     data && data.pool_event.length > 0
//       ? data?.pool_event[0].total_supply.toLocaleString('fullwide', { useGrouping: false })
//       : 0,
//   );
// };

// export const usePoolsTotalSupply = (): PoolsTotalSupply => {
//   const { data } = useQuery<PoolsTotalSupplyQuery>(
//     POOLS_TOTAL_SUPPLY,
//   );
//   if (!data) {
//     return {};
//   }
//   return data.pool_event.reduce((acc, { pool: { address }, total_supply }) => {
//     acc[address] = BigNumber.from(total_supply.toLocaleString('fullwide', { useGrouping: false }));
//     return acc;
//   }, {});
// };

// export const useFindUserPools = (signerNativeAddress: string): string[] => {
//   const { data } = useQuery<UserPoolsQuery, UserPoolsVar>(
//     USER_POOLS,
//     { variables: { address: signerNativeAddress } },
//   );
//   if (!data) {
//     return [];
//   }
//   return data.pool_event.map(({ pool: { address } }) => address);
// };
