import { DocumentNode, gql } from '@apollo/client';
import { BaseFeeData, BaseReservedData, BaseVolumeData, PoolData, ReservedData } from '../state';

// Data interfaces
export type BasePoolTransactionTypes = 'Swap' | 'Mint' | 'Burn';
export type TransactionTypes = BasePoolTransactionTypes | 'All';

// Pool information interfaces
interface Timeframe {
  timeframe: string;
}

interface Supply {
  totalSupply: number;
  supply: number;
}

export interface Amounts {
  amount1: number;
  amount2: number;
}

interface TimeframedVolume extends Amounts, Timeframe { }

interface Fee {
  fee1: number;
  fee2: number;
}

interface TimeframedFee extends Fee, Timeframe { }

interface Reserves {
  reserved1: number;
  reserved2: number;
}

export interface AllPool extends BasicPoolData, Reserves {}

interface ContractData {
  symbol: string;
  name: string;
  decimals: number;
}

interface Pool {
  address: string;
  supply: Supply[];
  symbol1: string;
  symbol2: string;
  decimal1: number;
  decimal2: number;
  volume_aggregate: { aggregate: { sum: Amounts } };
}

interface BasicPoolData {
  address: string;
  token1: string;
  token2: string;
  decimal1: number;
  decimal2: number;
  name1: string;
  name2: string;
  symbol1: string;
  symbol2: string;
}

interface PoolTokens {
  token1: string;
  token2: string;
}

interface PoolTokensData extends PoolTokens {
  decimal1: number;
  decimal2: number;
  name1: string;
  name2: string;
  symbol1: string;
  symbol2: string;
}


interface ContractData {
  contractData: ContractData
}

interface PoolInfo {
  reserves: BaseReservedData;
  fee: BaseFeeData;
  currentDayVolume: BaseVolumeData;
  previousDayVolume: BaseVolumeData;
  totalSupply: string;
  userSupply: string;
}

interface PoolTransaction {
  amount_1: number;
  amount_2: number;
  amount_in_1: number;
  amount_in_2: number;
  sender_address: string;
  to_address: string | null;
  timestamp: string;
  type: BasePoolTransactionTypes;
  pool: {
    token_contract_1: {
      verified_contract: null | {
        contract_data: ContractData;
      };
    };
    token_contract_2: {
      verified_contract: null | {
        contract_data: ContractData;
      };
    };
  };
  evm_event: {
    event: {
      id: number;
      extrinsic: {
        hash: string;
        signer: string;
      };
    };
  };
}

// Charts interfaces
interface TVLData extends Timeframe {
  total_supply: number;
}

export interface CandlestickData {
  pool_id: number,
  timeframe: string;
  close_1: number;
  close_2: number;
  high_1: number;
  high_2: number;
  open_1: number;
  open_2: number;
  low_1: number;
  low_2: number;
  which_token: number;
  pool: {
    token_1: string;
    token_2: string;
  }
}

interface LastClose {
  close: number;
}

export interface PoolListItem {
  id: string;
  token1: string;
  token2: string;
  reserved1: string;
  reserved2: string;
  decimal1: number;
  decimal2: number;
  symbol1: string;
  symbol2: string;
  name1: string;
  name2: string;
  dayVolume1: string | null;
  dayVolume2: string | null;
  prevDayVolume1: string | null;
  prevDayVolume2: string | null;
  userLockedAmount1: string | null;
  userLockedAmount2: string | null;
}

// Query result interfaces
export type PoolQuery = { pool: BasicPoolData[] };
export type PoolTokensQuery = { poolById: PoolTokens }
export type PoolTokensDataQuery = { poolById: PoolTokensData }
export type ContractDataQuery = { verifiedContractById: ContractData }
export type PoolInfoQuery = { poolInfo: PoolInfo }
export type PoolDataQuery = { poolData: PoolDataFull }
export type PoolsQuery = { verified_pool: Pool[] };
export type PoolDayFeeQuery = { poolDayFees: TimeframedFee[] };
export type PoolTvlQuery = { pool_day_supply: TVLData[] };
export type PoolReservesQuery = { poolEvents: Reserves[] };
export type AllPoolsQuery = { allPools: AllPool[] }
export type PoolSupplyQuery = { poolMinuteSupplies: Supply[] };
export type PoolDayVolumeQuery = { poolDayVolumes: TimeframedVolume[] };
export type PoolTransactionQuery = { verified_pool_event: PoolTransaction[] };
export type PoolDayCandlestickQuery = { poolDayCandlesticks: CandlestickData[]; }
export type PoolVolumeAggregateQuery = { pool_hour_volume_aggregate: { aggregate: { sum: Amounts } }; };
export type AllPoolsListQuery = { allPoolsList: PoolListItem[] };
export type AllPoolsListCountQuery = { allPoolsListCount: number };
export type UserPoolsListQuery = { userPoolsList: PoolListItem[] };
export type UserPoolsListCountQuery = { userPoolsListCount: number };

// TODO: remove all commented code ?

// export type PoolsTotalSupplyQuery = {
//   pool_event: {
//     pool: {
//       address: string;
//     }
//     total_supply: number;
//   }[];
// }
// export type PoolLPQuery = {
//   pool_event: {
//     total_supply: number
//   }[];
// };

// export type PoolUserLPQuery = {
//   pool_event_aggregate: {
//     aggregate: {
//       sum: {
//         supply: number;
//       };
//     };
//   };
// };
// export type UserPoolsQuery = {
//   pool_event: {
//     pool: {
//       address: string;
//     }
//   }[];
// }

export type PoolFeeQuery = {
  pool_hour_fee_aggregate: {
    aggregate: {
      sum: Fee;
    };
  };
};
export type PoolTransactionCountQuery = {
  verified_pool_event_aggregate: {
    aggregate: {
      count: number;
    };
  };
}
// export type PoolCountQuery = {
//   verified_pool_aggregate: {
//     aggregate: {
//       count: number;
//     };
//   };
// }

export type PoolHourVolumeAggregate = {
  pool_hour_volume_aggregate: {
    aggregate: {
      sum: Amounts
    }
  }
}

export type Pool24HVolume = {
  volume: {
    pool: {
      address: string;
      token1: string;
      token2: string;
    };
    amount1: number;
    amount2: number;
  }[];
}

export interface PoolDataFull extends PoolData {
  previousReserved: ReservedData[];
  previousCandlestick1: LastClose[];
  previousCandlestick2: LastClose[];
}

export type PoolsTotalSupply = {
  totalSupply: {
    pool: {
      address: string;
      token1: string;
      token2: string;
    };
    reserved1: number;
    reserved2: number;
  }[];
};

// Query variable interfaces
interface FromVar {
  fromTime: string;
}
interface AddressVar {
  address: string;
}
interface SignerAddressVar {
  signerAddress: string;
}
interface ToVar {
  toTime: string;
}
interface OptionalSearchVar {
  search: { _ilike?: string };
}
interface OffsetVar {
  offset: number;
}
interface LimitVar {
  limit: number;
}
interface TransactionTypeVar {
  type: BasePoolTransactionTypes[];
}
interface WhichTokenVar {
  whichToken: number;
}
interface PaginationVar {
  limit: number;
  offset: number;
}
interface PoolSearchVar {
  search: string;
  signer: string;
}

export type PoolVar = AddressVar
export type PoolSupplyVar = AddressVar
export type PoolVolume24HVar = FromVar;
export type PoolReservesVar = AddressVar
// export type PoolCountVar = OptionalSearchVar
// export type UserPoolsVar = AddressVar
export type PoolsTotalValueLockedVar = ToVar
export type PoolTokensVar = AddressVar
export type ContractDataVar = AddressVar
export interface PoolFeeVar extends AddressVar, FromVar { }
export interface PoolTvlVar extends AddressVar, FromVar { }
export interface PoolDataVar extends AddressVar, FromVar { }
export interface PoolVolumeVar extends AddressVar, FromVar { }
export interface PoolHourFeeVar extends AddressVar, FromVar { }
export interface PoolVolumeAggregateVar extends PoolFeeVar, ToVar { }
// export interface PoolUserLpVar extends AddressVar, SignerAddressVar { }
export interface PoolsVar extends FromVar, OffsetVar, OptionalSearchVar { }
export interface PoolLastCandlestickVar extends AddressVar, WhichTokenVar { }
export interface PoolInfoVar extends AddressVar, FromVar, ToVar, SignerAddressVar { }
export interface PoolDayCandlestickVar extends AddressVar, FromVar, WhichTokenVar { }
export interface PoolBasicTransactionVar extends OptionalSearchVar, TransactionTypeVar { }
export interface PoolTransactionCountVar extends OptionalSearchVar, TransactionTypeVar { }
export interface PoolTransactionVar extends PoolBasicTransactionVar, OffsetVar, LimitVar { }
export interface PoolsListVar extends PoolSearchVar, PaginationVar { }
export interface PoolsListCountVar extends PoolSearchVar { }

// Graphql statements
// Total supply of all pools
export const POOLS_TOTAL_VALUE_LOCKED = gql`
  query totalSupply($toTime: String!) {
    totalSupply(toTime: $toTime) {
      pool {
        address
        token1
        token2
      }
      reserved1
      reserved2
    }
  }
`;

// Aggregating pool hour volume
export const POOL_24H_VOLUME = gql`
  query volume($fromTime: String!) {
    volume(fromTime: $fromTime) {
      pool {
        address
        token1
        token2
      }
      amount1
      amount2
    }
  }
`;

// export const POOL_USER_LP = gql`
// query user_lp($address: String!, $signerAddress: String!) {
//   pool_event_aggregate(
//     where: {
//       pool_id: { _eq: 13 }
//       pool: {
//         address: { _eq: $address }
//       }
//       evm_event: {
//         event: {
//           extrinsic: {
//             signer: { _eq: $signerAddress }
//           }
//         }
//       }
//     }
//   ) {
//     aggregate {
//       sum {
//         supply
//       }
//     }
//   }
// }
// `;

// export const POOL_TOTAL_SUPPLY = gql`
// query pool_lp($address: String!) {
//   pool_event(
//     distinct_on: pool_id
//     where: {
//       type: { _eq: "Transfer" }
//       pool: {
//         address: { _eq: $address }
//       }
//     }
//     order_by: {
//       pool_id: asc
//       timestamp: desc
//     }
//     limit: 1
//   ) {
//     total_supply
//   }
// }
// `;
// export const POOLS_TOTAL_SUPPLY = gql`
// query pool_lp {
//   pool_event(
//     distinct_on: pool_id
//     where: {
//       type: { _eq: "Transfer" }
//     }
//     order_by: {
//       pool_id: asc
//       timestamp: desc
//     }
//   ) {
//     pool {
//       address
//     }
//     total_supply
//   }
// }
// `;

// export const USER_POOLS = gql`
// query user_pools($address: String!) {
//   pool_event(
//     distinct_on: pool_id
//     where: {
//       type: { _eq: "Transfer" }
//       evm_event: {
//         event: {
//           extrinsic: {
//             signer: { _eq: $address }
//           }
//         }
//       }
//     }
//     order_by: {
//       pool_id: asc
//       timestamp: desc
//     }
//   ) {
//     pool {
//       address
//     }
//   }
// }
// `;

export const POOL_SUPPLY_GQL = gql`
  query pool_supply($address: String!) {
    poolMinuteSupplies(
      where: { poolId_eq: $address }
      orderBy: timeframe_DESC
      limit: 1
    ) {
      totalSupply
      supply
    }
  }
`;

export const POOL_VOLUME_AGGREGATE_GQL = gql`
  query pool_volume(
    $address: String!
    $fromTime: String!
    $toTime: String!
  ) {
    pool_hour_volume_aggregate(
      where: {
        _and: [
          { poolId_eq: $address }
          { timeframe_gte: $fromTime }
          { timeframe_lt: $toTime }
        ]
      }
    ) {
      aggregate {
        sum {
          amount_1
          amount_2
        }
      }
    }
  }
`;

const volumeQuery = (time: Time): DocumentNode => gql`
query volume($address: String!, $fromTime: String!) {
  pool${time}Volumes(
    where: {
      timeframe_gte: $fromTime
      poolId_eq: $address
    }
    orderBy: timeframe_ASC
  ) {
    amount1
    amount2
    timeframe
  }
}`;
export const POOL_DAY_VOLUME_GQL = volumeQuery('Day');
export const POOL_HOUR_VOLUME_GQL = volumeQuery('Hour');
export const POOL_MINUTE_VOLUME_GQL = volumeQuery('Minute');

export const POOL_FEES_GQL = gql`
  query pool_fee($address: String!, $fromTime: String!) {
    pool_hour_fee_aggregate(
      where: {
        poolId_eq: $address
        timeframe_gte: $fromTime
      }
    ) {
      aggregate {
        sum {
          fee_1
          fee_2
        }
      }
    }
  }
`;

export const POOL_GQL = gql`
  query pool($address: String!) {
    poolById(id: $address) {
      id
      token1
      token2
      decimal1
    	decimal2
    	symbol1
    	symbol2
    }
  }
`;

export const POOL_CURRENT_RESERVES_GQL = gql`
  query pool_event($address: String!) {
    poolEvents(
      where: { pool: { id_eq: $address }, type_eq: Sync }
      orderBy: timestamp_DESC
      limit: 1
    ) {
      reserved1
      reserved2
    }
  }
`;

export const POOLS_GQL = gql`
  query pool(
    $offset: Int!
    $search: String_comparison_exp!
    $fromTime: String!
  ) {
    verified_pool(
      where: {
        _or: [
          { name_1: $search }
          { name_2: $search }
          { address: $search }
          { symbol_1: $search }
          { symbol_2: $search }
        ]
      }
      orderBy: { supply_aggregate: { sum: { supply: desc } } }
      limit: 10
      offset: $offset
    ) {
      address
      supply(limit: 1, orderBy: timeframe_DESC) {
        total_supply
        supply
      }
      volume_aggregate(
        distinct_on: timeframe
        where: { timeframe_gte: $fromTime }
      ) {
        aggregate {
          sum {
            amount_1
            amount_2
          }
        }
      }
      symbol_1
      symbol_2
      decimal_1
      decimal_2
    }
  }
`;

export const POOL_TRANSACTIONS_GQL = gql`
  subscription transactions(
    $search: String_comparison_exp!
    $type: [pooltype!]
    $offset: Int!
    $limit: Int!
  ) {
    verified_pool_event(
      orderby: timestamp_DESC
      where: { pool: { address: $search }, type: { _in: $type } }
      limit: $limit
      offset: $offset
    ) {
      amount_1
      amount_2
      amount_in_1
      amount_in_2
      sender_address
      to_address
      timestamp
      type
      pool {
        token_contract_2 {
          verified_contract {
            contract_data
          }
        }
        token_contract_1 {
          verified_contract {
            contract_data
          }
        }
      }
      evm_event {
        event {
          id
          extrinsic {
            hash
            signer
          }
        }
      }
    }
  }
`;

export const POOL_TRANSACTION_COUNT_GQL = gql`
  subscription transaction_count(
    $search: String_comparison_exp!
    $type: [pooltype]!
  ) {
    verified_pool_event_aggregate(
      where: { pool: { address: $search }, type: { _in: $type } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// export const POOL_COUNT_GQL = gql`
//   query pool_count($search: String_comparison_exp!) {
//     verified_pool_aggregate(
//       where: {
//         _or: [
//           { name_1: $search }
//           { name_2: $search }
//           { address: $search }
//           { symbol_1: $search }
//           { symbol_2: $search }
//         ]
//       }
//     ) {
//       aggregate {
//         count
//       }
//     }
//   }
// `;

// Charts queryes & subscriptions
type Time = 'Day' | 'Hour' | 'Minute';

const tvlQuery = (time: Time): DocumentNode => gql`
query pool_supply($address: String!, $fromTime: String!) {
  pool${time}Supplies(
    distinct_on: timestamp
    where: {
      poolId_eq: $address
      timeframe_gte: $fromTime
    }
    orderBy: timeframe_ASC
  ) {
    total_supply
    timeframe
  }
}`;
export const POOL_DAY_TVL_GQL = tvlQuery('Day');
export const POOL_HOUR_TVL_GQL = tvlQuery('Hour');
export const POOL_MINUTE_TVL_GQL = tvlQuery('Minute');

const candlestickQuery = (time: Time): DocumentNode => gql`
query candlestick($address: String!, $whichToken: Int!, $fromTime: String!) {
  pool${time}Candlesticks(
    orderBy: timeframe_ASC
    distinct_on: timeframe
    where: {
      poolId_eq: $address
      which_token: { _eq: $whichToken }
      timeframe_gte: $fromTime
    }
  ) {
    pool_id
    timeframe
    close_1
    close_2
    high_1
    high_2
    low_1
    low_2
    open_1
    open_2
    which_token
    pool {
      token_1
      token_2
    }
  }
}
`;

export const POOL_DAY_CANDLESTICK_GQL = candlestickQuery('Day');
export const POOL_HOUR_CANDLESTICK_GQL = candlestickQuery('Hour');
export const POOL_MINUTE_CANDLESTICK_GQL = candlestickQuery('Minute');

export const POOL_LAST_CANDLESTICH_GQL = gql`
query candlestick($address: String!, $whichToken: Int!, $fromTime: String!) {
  pool_day_candlestick(
    orderBy: timeframe_DESC
    distinct_on: timeframe
    where: {
      pool: { address: { _eq: $address } }
      which_token: { _eq: $whichToken }
      timeframe_lte: $fromTime
    }
    limit: 1
  ) {
    pool_id
    timeframe
    close_1
    close_2
    high_1
    high_2
    low_1
    low_2
    open_1
    open_2
    which_token
    pool {
      token_1
      token_2
    }
  }
}
`;

const feeQuery = (time: Time): DocumentNode => gql`
query fee($address: String!, $fromTime: String!) {
  pool${time}Fees(
    distinct_on: timeframe
    where: {
      timeframe_gte: $fromTime
      poolId_eq: $address
    }
    orderBy: timeframe_ASC
  ) {
    fee1
    fee2
    timeframe
  }
}
`;

export const POOL_DAY_FEE_QUERY_GQL = feeQuery('Day');
export const POOL_HOUR_FEE_QUERY_GQL = feeQuery('Hour');
export const POOL_MINUTE_FEE_QUERY_GQL = feeQuery('Minute');

// export const POOL_RESERVES_SUBSCRIPTION = gql`
//   subscription pool_event {
//     pool_event(
//       where: { type: { _eq: "Sync" } }
//       distinct_on: [pool_id]
//       order_by: { timestamp: desc, pool_id: asc }
//     ) {
//       reserved_1
//       reserved_2
//       pool {
//         token_1
//         token_2
//       }
//     }
//   }
// `;

export const POOL_TOKENS_GQL = gql`
  query poolTokens($address: String!) {
    poolById(id: $address) {
      token1
      token2
    }
  }
`;

export const POOL_TOKENS_DATA_GQL = gql`
  query poolTokens($address: String!) {
    poolById(id: $address) {
      token1
      token2
      decimal1
      decimal2
      name1
      name2
      symbol1
      symbol2
    }
  }
`;

export const POOL_INFO_GQL = gql`
  query poolInfo(
    $address: String!
    $signerAddress: String!
    $fromTime: String!
    $toTime: String!
  ) {
    poolInfo(
      address: $address
      signerAddress: $signerAddress
      fromTime: $fromTime
      toTime: $toTime
    ) {
      fee {
        fee1
        fee2
      }
      currentDayVolume {
        amount1
        amount2
      }
      previousDayVolume {
        amount1
        amount2
      }
      reserves {
        reserved1
        reserved2
      }
      totalSupply
      userSupply
    }
  }
`;

export const POOL_DATA_GQL = gql`
  query poolData($address: String!, $fromTime: String!) {
    poolData(address: $address, fromTime: $fromTime) {
      candlestick1 {
        close
        high
        open
        low
        timeframe
      }
      candlestick2 {
        close
        high
        open
        low
        timeframe
      }
      fee {
        fee1
        fee2
        timeframe
      }
      volume {
        amount1
        amount2
        timeframe
      }
      reserves {
        reserved1
        reserved2
        timeframe
      }
      previousReserves {
        timeframe
        reserved1
        reserved2
      }
      previousCandlestick1 {
        close
      }
      previousCandlestick2 {
        close
      }
    }
  }
`;

// export const N_VERIFIED_POOLS = gql`
// query nPools {
//   verified_pool_aggregate {
//     aggregate {
//       count
//     }
//   }
// }
// `;

// // Subscriptions
// export const ALL_POOL_SUBSCRIPTION = gql`
// subscription pool_event {
//   pool_event(
//     where: { type_eq: Sync }
//     distinct_on: [pool_id]
//     orderBy: [timestamp_DESC, poolId_ASC] }
//   ) {
//     reserved_1
//     reserved_2
//     pool {
//       address
//       token_1
//       token_2
//       token_contract_1 {
//         verified_contract {
//           contract_data
//         }
//       }
//       token_contract_2 {
//         verified_contract {
//           contract_data
//         }
//       }
//     }
//   }
// }
// `;

export const ALL_POOLS = gql`
  query allPools {
    allPools {
      address
      decimal1
      decimal2
      reserved1
      reserved2
      symbol1
      symbol2
      token1
      token2
    }
  }
`;

export const ALL_POOLS_LIST = gql`
  query allPoolsList($signer: String!, $limit: Float!, $offset: Float!, $search: String!) {
    allPoolsList(signer: $signer, limit: $limit, offset: $offset, search: $search) {
      id
      name1
      name2
      prevDayVolume1
      prevDayVolume2
      reserved1
      reserved2
      symbol1
      symbol2
      token1
      token2
      userLockedAmount1
      userLockedAmount2
      dayVolume2
      dayVolume1
      decimal1
      decimal2
    }
  }
`;

export const ALL_POOLS_LIST_COUNT = gql`
  query allPoolsList_count($signer: String!, $search: String!) {
    allPoolsListCount(signer: $signer, search: $search)
  }
`;

export const USER_POOLS_LIST = gql`
  query userPoolsList($signer: String!, $limit: Float!, $offset: Float!, $search: String!) {
    userPoolsList(signer: $signer, limit: $limit, offset: $offset, search: $search) {
      id
      name1
      name2
      prevDayVolume1
      prevDayVolume2
      reserved1
      reserved2
      symbol1
      symbol2
      token1
      token2
      userLockedAmount1
      userLockedAmount2
      dayVolume2
      dayVolume1
      decimal1
      decimal2
    }
  }
`;

export const USER_POOLS_LIST_COUNT = gql`
  query user_pools_list_count($signer: String!, $search: String!) {
    userPoolsListCount(signer: $signer, search: $search)
  }
`;
