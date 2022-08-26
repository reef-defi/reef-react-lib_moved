import { DocumentNode, gql } from '@apollo/client';
import { ERC20ContractData, PoolData, ReservedData } from '../state';

// Data interfaces
export type BasePoolTransactionTypes = 'Swap' | 'Mint' | 'Burn';
export type TransactionTypes = BasePoolTransactionTypes | 'All';

// Pool information interfaces
interface Supply {
  total_supply: number;
  supply: number;
}
export interface Amounts {
  amount_1: number;
  amount_2: number;
}

interface TimeframedVolume extends Amounts {
  timeframe: string;
}
interface Fee {
  fee_1: number;
  fee_2: number;
}

interface Reserves {
  reserved_1: number;
  reserved_2: number;
}
interface AllPool extends Reserves {
  pool: {
    address: string;
    token_1: string;
    token_2: string;

    token_contract_1: {
      verified_contract: {
        contract_data: ERC20ContractData;
      } | null
    }
    token_contract_2: {
      verified_contract: {
        contract_data: ERC20ContractData;
      } | null
    }
  }
}
interface ContractData {
  symbol: string;
  name: string;
  decimals: number;
}

interface Pool {
  address: string;
  supply: Supply[];
  symbol_1: string;
  symbol_2: string;
  decimal_1: number;
  decimal_2: number;
  volume_aggregate: { aggregate: { sum: Amounts } };
}

interface VerifiedContract {
  verified_contract: null | {
    contract_data: ContractData;
  }
}

interface BasicPoolData {
  id: number;
  address: string;
  token_contract_1: {
    address: string;
    verified_contract: null | {
      contract_data: ContractData;
    };
  };
  token_contract_2: {
    address: string;
    verified_contract: null | {
      contract_data: ContractData;
    };
  };
}

type AggregateSum <T> = {
  aggregate: {
    sum: T;
  }
};

interface PoolInfo {
  token1: string;
  token2: string;
  reserves: Reserves[];
  tokenContract1: VerifiedContract;
  tokenContract2: VerifiedContract;
  fee: AggregateSum<Fee>;
  currentDayVolume: AggregateSum<Amounts>;
  previousDayVolume: AggregateSum<Amounts>;
  totalSupply: {total_supply: string}[];
  userSupply: AggregateSum<{supply: string}>;
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
interface TVLData {
  total_supply: number;
  timeframe: string;
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

interface Fee {
  fee_1: number;
  fee_2: number;
  timeframe: string;
}

interface LastClose {
  close: number;
}

// Query result interfaces
export type PoolQuery = { pool: BasicPoolData[] };
export type PoolInfoQuery = { pool: PoolInfo[] }
export type PoolsQuery = { verified_pool: Pool[] };
export type PoolDayFeeQuery = { pool_day_fee: Fee[] };
export type PoolTvlQuery = { pool_day_supply: TVLData[] };
export type PoolReservesQuery = { pool_event: Reserves[] };
export type AllPoolSubscription = { pool_event: AllPool[] }
export type PoolSupplyQuery = { pool_minute_supply: Supply[] };
export type PoolDayVolumeQuery = { pool_day_volume: TimeframedVolume[] };
export type PoolTransactionQuery = { verified_pool_event: PoolTransaction[] };
export type PoolDayCandlestickQuery = { pool_day_candlestick: CandlestickData[]; }
export type PoolVolumeAggregateQuery = {
  pool_hour_volume_aggregate: { aggregate: { sum: Amounts } };
};
export type PoolsTotalSupplyQuery = {
  pool_event: {
    pool: {
      address: string;
    }
    total_supply: number;
  }[];
}
export type PoolLPQuery = {
  pool_event: {
    total_supply: number
  }[];
};

export type PoolUserLPQuery = {
  pool_event_aggregate: {
    aggregate: {
      sum: {
        supply: number;
      };
    };
  };
};
export type UserPoolsQuery = {
  pool_event: {
    pool: {
      address: string;
    }
  }[];
}

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
export type PoolCountQuery = {
  verified_pool_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export type PoolHourVolumeAggregate = {
  pool_hour_volume_aggregate: {
    aggregate: {
      sum: Amounts
    }
  }
}
export type Pool24HVolume = {
  pool_hour_volume: {
    pool: {
      address: string;
      token_1: string;
      token_2: string;
    };
    timeframe: string;
    amount_1: number;
    amount_2: number;
  }[];
}

export interface PoolDataQuery extends PoolData {
  previousReserved: ReservedData[];
  previousCandlestick1: LastClose[];
  previousCandlestick2: LastClose[];
}

export type PoolsTotalSupply = {
  pool_event: AllPool[];
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

export type PoolVar = AddressVar
export type PoolSupplyVar = AddressVar
export type PoolVolume24HVar = FromVar;
export type PoolReservesVar = AddressVar
export type PoolCountVar = OptionalSearchVar
export type UserPoolsVar = AddressVar
export type PoolsTotalValueLockedVar = ToVar
export interface PoolFeeVar extends AddressVar, FromVar { }
export interface PoolTvlVar extends AddressVar, FromVar { }
export interface PoolDataVar extends AddressVar, FromVar { }
export interface PoolVolumeVar extends AddressVar, FromVar { }
export interface PoolHourFeeVar extends AddressVar, FromVar { }
export interface PoolVolumeAggregateVar extends PoolFeeVar, ToVar { }
export interface PoolUserLpVar extends AddressVar, SignerAddressVar { }
export interface PoolsVar extends FromVar, OffsetVar, OptionalSearchVar { }
export interface PoolLastCandlestickVar extends AddressVar, WhichTokenVar { }
export interface PoolInfoVar extends AddressVar, FromVar, ToVar, SignerAddressVar { }
export interface PoolDayCandlestickVar extends AddressVar, FromVar, WhichTokenVar { }
export interface PoolBasicTransactionVar extends OptionalSearchVar, TransactionTypeVar { }
export interface PoolTransactionCountVar extends OptionalSearchVar, TransactionTypeVar { }
export interface PoolTransactionVar extends PoolBasicTransactionVar, OffsetVar, LimitVar { }
// Graphql statements
// Total supply of all pools
export const POOLS_TOTAL_VALUE_LOCKED = gql`
query total_supply($toTime: timestamptz!) {
  pool_event(
    distinct_on: pool_id
    where: {
      type: { _eq: "Sync" }
      timestamp: { _lt: $toTime }
    }
    order_by: {
      pool_id: asc
      timestamp: desc
    }
  ) {
    pool {
      address
      token_1
      token_2
    }
    reserved_1
    reserved_2
  }
}
`;

// Aggregating pool hour volume
export const POOL_24H_VOLUME = gql`
query volume($fromTime: timestamptz!) {
	pool_hour_volume(
    distinct_on: [pool_id, timeframe]
    order_by: {
      pool_id: asc
      timeframe: desc
    }
    where: {
      timeframe: { _gte: $fromTime }
    }
  ) {
    pool {
      address
      token_1
      token_2
    }
    amount_1
    amount_2
  }
}
`;

export const POOL_USER_LP = gql`
query user_lp($address: String!, $signerAddress: String!) {
  pool_event_aggregate(
    where: {
      pool_id: { _eq: 13 }
      pool: {
        address: { _eq: $address }
      }
      evm_event: {
        event: {
          extrinsic: {
            signer: { _eq: $signerAddress }
          }
        }
      }
    }
  ) {
    aggregate {
      sum {
        supply
      }
    }
  }
}
`;

export const POOL_TOTAL_SUPPLY = gql`
query pool_lp($address: String!) {
  pool_event(
    distinct_on: pool_id
    where: {
      type: { _eq: "Transfer" }
      pool: {
        address: { _eq: $address }
      }
    }
    order_by: {
      pool_id: asc
      timestamp: desc
    }
    limit: 1
  ) {
    total_supply
  }
}
`;
export const POOLS_TOTAL_SUPPLY = gql`
query pool_lp {
  pool_event(
    distinct_on: pool_id
    where: {
      type: { _eq: "Transfer" }
    }
    order_by: {
      pool_id: asc
      timestamp: desc
    }
  ) {
    pool {
      address
    }
    total_supply
  }
}
`;

export const USER_POOLS = gql`
query user_pools($address: String!) {
  pool_event(
    distinct_on: pool_id
    where: {
      type: { _eq: "Transfer" }
      evm_event: {
        event: {
          extrinsic: {
            signer: { _eq: $address }
          }
        }
      }
    }
    order_by: {
      pool_id: asc
      timestamp: desc
    }
  ) {
    pool {
      address
    }
  }
}
`;

export const POOL_SUPPLY_GQL = gql`
  query pool_supply($address: String!) {
    pool_minute_supply(
      where: { pool: { address: { _ilike: $address } } }
      order_by: { timeframe: desc }
      limit: 1
    ) {
      total_supply
      supply
      timeframe
    }
  }
`;

export const POOL_VOLUME_AGGREGATE_GQL = gql`
  query pool_volume(
    $address: String!
    $fromTime: timestamptz!
    $toTime: timestamptz!
  ) {
    pool_hour_volume_aggregate(
      where: {
        _and: [
          { pool: { address: { _ilike: $address } } }
          { timeframe: { _gte: $fromTime } }
          { timeframe: { _lt: $toTime } }
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
query volume($address: String!, $fromTime: timestamptz!) {
  pool_${time}_volume(
    where: {
      timeframe: { _gte: $fromTime }
      pool: { address: { _ilike: $address } }
    }
    order_by: { timeframe: asc }
  ) {
    amount_1
    amount_2
    timeframe
  }
}`;
export const POOL_DAY_VOLUME_GQL = volumeQuery('day');
export const POOL_HOUR_VOLUME_GQL = volumeQuery('hour');
export const POOL_MINUTE_VOLUME_GQL = volumeQuery('minute');

export const POOL_FEES_GQL = gql`
  query pool_fee($address: String!, $fromTime: timestamptz!) {
    pool_hour_fee_aggregate(
      where: {
        pool: { address: { _ilike: $address } }
        timeframe: { _gte: $fromTime }
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
    pool(where: { address: { _ilike: $address } }) {
      id
      address
      token_contract_1 {
        verified_contract {
          contract_data
        }
        address
      }
      token_contract_2 {
        verified_contract {
          contract_data
        }
        address
      }
    }
  }
`;

export const POOL_CURRENT_RESERVES_GQL = gql`
  query pool_event($address: String!) {
    pool_event(
      where: { pool: { address: { _ilike: $address } }, type: { _eq: "Sync" } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      reserved_1
      reserved_2
    }
  }
`;

export const POOLS_GQL = gql`
  query pool(
    $offset: Int!
    $search: String_comparison_exp!
    $fromTime: timestamptz!
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
      order_by: { supply_aggregate: { sum: { supply: desc } } }
      limit: 10
      offset: $offset
    ) {
      address
      supply(limit: 1, order_by: { timeframe: desc }) {
        total_supply
        supply
      }
      volume_aggregate(
        distinct_on: timeframe
        where: { timeframe: { _gte: $fromTime } }
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
      order_by: { timestamp: desc }
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

export const POOL_COUNT_GQL = gql`
  query pool_count($search: String_comparison_exp!) {
    verified_pool_aggregate(
      where: {
        _or: [
          { name_1: $search }
          { name_2: $search }
          { address: $search }
          { symbol_1: $search }
          { symbol_2: $search }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Charts queryes & subscriptions
type Time = 'day' | 'hour' | 'minute';

const tvlQuery = (time: Time): DocumentNode => gql`
query pool_supply($address: String!, $fromTime: timestamptz!) {
  pool_${time}_supply(
    distinct_on: timestamp
    where: {
      pool: { address: { _ilike: $address } }
      timeframe: { _gte: $fromTime }
    }
    order_by: { timeframe: asc }
  ) {
    total_supply
    timeframe
  }
}`;
export const POOL_DAY_TVL_GQL = tvlQuery('day');
export const POOL_HOUR_TVL_GQL = tvlQuery('hour');
export const POOL_MINUTE_TVL_GQL = tvlQuery('minute');

const candlestickQuery = (time: Time): DocumentNode => gql`
query candlestick($address: String!, $whichToken: Int!, $fromTime: timestamptz!) {
  pool_${time}_candlestick(
    order_by: { timeframe: asc }
    distinct_on: timeframe
    where: {
      pool: { address: { _ilike: $address } }
      which_token: { _eq: $whichToken }
      timeframe: { _gte: $fromTime }
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

export const POOL_DAY_CANDLESTICK_GQL = candlestickQuery('day');
export const POOL_HOUR_CANDLESTICK_GQL = candlestickQuery('hour');
export const POOL_MINUTE_CANDLESTICK_GQL = candlestickQuery('minute');

export const POOL_LAST_CANDLESTICH_GQL = gql`
query candlestick($address: String!, $whichToken: Int!, $fromTime: timestamptz!) {
  pool_day_candlestick(
    order_by: { timeframe: desc }
    distinct_on: timeframe
    where: {
      pool: { address: { _eq: $address } }
      which_token: { _eq: $whichToken }
      timeframe: { _lte: $fromTime }
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
query fee($address: String!, $fromTime: timestamptz!) {
  pool_${time}_fee(
    distinct_on: timeframe
    where: {
      timeframe: { _gte: $fromTime }
      pool: { address: { _ilike: $address } }
    }
    order_by: { timeframe: asc }
  ) {
    fee_1
    fee_2
    timeframe
  }
}
`;

export const POOL_DAY_FEE_QUERY_GQL = feeQuery('day');
export const POOL_HOUR_FEE_QUERY_GQL = feeQuery('hour');
export const POOL_MINUTE_FEE_QUERY_GQL = feeQuery('minute');

export const POOL_RESERVES_SUBSCRITION = gql`
  subscription pool_event {
    pool_event(
      where: { type: { _eq: "Sync" } }
      distinct_on: [pool_id]
      order_by: { timestamp: desc, pool_id: asc }
    ) {
      reserved_1
      reserved_2
      pool {
        token_1
        token_2
      }
    }
  }
`;

export const POOL_INFO_GQL = gql`
subscription pool($address: String!, $signerAddress: String!, $fromTime: timestamptz!, $toTime: timestamptz!) {
  pool(
    where: {
      address: { _eq: $address }
    }
  ) {
    token1: token_1
    token2: token_2
    tokenContract1: token_contract_1 {
      verified_contract {
        contract_data
      }
    }
    tokenContract2: token_contract_2 {
      verified_contract {
        contract_data
      }
    }
    fee: fee_aggregate(
      distinct_on: timeframe
      where: {
        timeframe: { _gte: $toTime }
      }
    ) {
      aggregate {
        sum {
          fee_1
          fee_2
        }
      }
    }
    currentDayVolume: volume_aggregate(
      distinct_on: timeframe
      where: {
        timeframe: { _gte: $toTime }
      }
    ) {
      aggregate {
        sum {
          amount_1
          amount_2
        }
      }
    }
    previousDayVolume: volume_aggregate(
      distinct_on: timeframe
      where: {
        _and: [
          { timeframe: { _gte: $fromTime } }
          { timeframe: { _lt: $toTime } }
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
    reserves: pool_event(
      where: { type: { _eq: "Sync" } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
        reserved_1
        reserved_2
    }
    totalSupply: pool_event(
      where: { type: { _eq: "Transfer" } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      total_supply
    }
    userSupply: pool_event_aggregate(
      where: {
        type: { _eq: "Transfer" }
        evm_event: {
          event: {
            extrinsic: {
              signer: { _eq: $signerAddress }
            }
          }
        }
      }
    ) {
      aggregate {
        sum {
          supply
        }
      }
    }
  }
}
`;

export const POOL_DATA_GQL = gql`
query poolData($address: String!, $fromTime: timestamptz!) {
  candlestick1: pool_day_candlestick(
    where: {
      which_token: { _eq: 1 }
      pool: { address: { _eq: $address } }
      timeframe: { _gte: $fromTime }
    }
    distinct_on: timeframe
  ) {
    close: close_1
    high: high_1
    open: open_1
    low: low_1
    timeframe
  }
  candlestick2: pool_day_candlestick(
    where: {
      which_token: { _eq: 2 }
      pool: { address: { _eq: $address } }
      timeframe: { _gte: $fromTime }
    }
    distinct_on: timeframe
  ) {
    close: close_2
    high: high_2
    open: open_2
    low: low_2
    timeframe
  }
  fee: pool_day_fee(
    where: {
      pool: { address: { _eq: $address } }
      timeframe: { _gte: $fromTime }
    }
    distinct_on: timeframe
  ) {
    fee1: fee_1
    fee2: fee_2
    timeframe
  }
  volume: pool_day_volume(
    where: {
      pool: { address: { _eq: $address } }
      timeframe: { _gte: $fromTime }
    }
    distinct_on: timeframe
  ) {
    amount1: amount_1
    amount2: amount_2
    timeframe
  }
  reserves: pool_day_locked(
    where: {
      pool: { address: { _eq: $address } }
      timeframe: { _gte: $fromTime }
    }
    distinct_on: timeframe
  ) {
    reserved1: reserved_1
    reserved2: reserved_2
    timeframe
  }
  previousReserves: pool_day_locked(
    where: {
      pool: { address: { _eq: $address } }
      timeframe: { _lt: $fromTime }
    }
    order_by: { timeframe: desc }
    limit: 1
  ) {
    timeframe
    reserved1: reserved_1
    reserved2: reserved_2
  }
  previousCandlestick1: pool_day_candlestick(
    where: {
      which_token: { _eq: 1 }
      pool: { address: { _eq: $address } }
      timeframe: { _lt: $fromTime }
    }
    order_by: { timeframe: desc }
    limit: 1
  ) {
    close: close_1
  }
  previousCandlestick2: pool_day_candlestick(
    where: {
      which_token: { _eq: 2 }
      pool: { address: { _eq: $address } }
      timeframe: { _lt: $fromTime }
    }
    order_by: { timeframe: desc }
    limit: 1
  ) {
    close: close_2
  }
}
`;

export const N_VERIFIED_POOLS = gql`
query nPools {
  verified_pool_aggregate {
    aggregate {
      count
    }
  }
}
`;

// Subscriptions
export const ALL_POOL_SUBSCRITION = gql`
subscription pool_event {
  pool_event(
    where: { type: { _eq: "Sync" } }
    distinct_on: [pool_id]
    order_by: { timestamp: desc, pool_id: asc }
  ) {
    reserved_1
    reserved_2
    pool {
      address
      token_1
      token_2
      token_contract_1 {
        verified_contract {
          contract_data
        }
      }
      token_contract_2 {
        verified_contract {
          contract_data
        }
      }
    }
  }
}
`;
