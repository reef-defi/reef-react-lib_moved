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
  reserved1: string;
  reserved2: string;
}

interface AllPool extends BasicPoolData, Reserves {}

interface ContractData {
  symbol: string;
  name: string;
  decimals: number;
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
  id: string;
  amount1: number;
  amount2: number;
  amountIn1: number;
  amountIn2: number;
  senderAddress: string;
  toAddress: string | null;
  blockHeight: number;
  indexInBlock: number;
  timestamp: string;
  type: BasePoolTransactionTypes;
  pool: {
    decimal1: number;
    decimal2: number;
    symbol1: string;
    symbol2: string;
  };
  signerAddress: string;
}

// Charts interfaces
interface TVLData extends Timeframe {
  totalSupply: number;
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
export type PoolDayFeeQuery = { poolTimeFees: TimeframedFee[] };
export type PoolDayTvlQuery = { poolTimeSupply: TVLData[] };
export type PoolReservesQuery = { poolEvents: Reserves[] };
export type AllPoolsQuery = { allPools: AllPool[] }
export type PoolSupplyQuery = { poolMinuteSupplies: Supply[] };
export type PoolDayVolumeQuery = { poolDayVolumes: TimeframedVolume[] };
export type PoolTransactionQuery = { poolEvents: PoolTransaction[] };
export type PoolVolumeAggregateQuery = { poolVolume: Amounts };
export type AllPoolsListQuery = { allPoolsList: PoolListItem[] };
export type AllPoolsListCountQuery = { allPoolsListCount: number };
export type UserPoolsListQuery = { userPoolsList: PoolListItem[] };
export type UserPoolsListCountQuery = { userPoolsListCount: number };
export type UserPoolSupplyQuery = { userPoolSupply: UserPoolSupply }

export type PoolFeeQuery = { poolFee: Fee };

export type PoolTransactionCountQuery = {
  poolEventsConnection: {
    totalCount: number;
  };
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
  previousReserves: ReservedData;
  allReserves: ReservedData[];
}

export type PoolsTotalSupply = {
  totalSupply: {
    pool: {
      address: string;
      token1: string;
      token2: string;
    };
    reserved1: string;
    reserved2: string;
  }[];
};

export interface UserPoolSupply extends Reserves {
  address: string;
  decimals: number;
  totalSupply: string;
  userSupply: string;
}

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
  search: string;
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
interface PaginationVar {
  limit: number;
  offset: number;
}
interface PoolSearchVar {
  search: string;
  signerAddress: string;
}

export interface UserPoolSupplyVar { 
  signerAddress: string;
  token1: string;
  token2: string;
}

export type PoolVar = AddressVar
export type PoolSupplyVar = AddressVar
export type PoolVolume24HVar = FromVar;
export type PoolReservesVar = AddressVar
export type PoolsTotalValueLockedVar = ToVar
export type PoolTokensVar = AddressVar
export type ContractDataVar = AddressVar
export interface PoolFeeVar extends AddressVar, FromVar { }
export interface PoolDayTvlVar extends AddressVar, FromVar { }
export interface PoolDataVar extends AddressVar, FromVar { }
export interface PoolVolumeVar extends AddressVar, FromVar { }
export interface PoolDayFeeVar extends AddressVar, FromVar { }
export interface PoolVolumeAggregateVar extends PoolFeeVar, ToVar { }
export interface PoolInfoVar extends AddressVar, FromVar, ToVar, SignerAddressVar { }
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

export const POOL_SUPPLY_GQL = gql`
  query poolSupply($address: String!) {
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
  query poolVolume(
    $address: String!
    $fromTime: String!
    $toTime: String!
  ) {
    poolVolume(
      address: $address
      fromTime: $fromTime
      toTime: $toTime
    ) {
      amount1
      amount2
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
  }
`;
export const POOL_DAY_VOLUME_GQL = volumeQuery('Day');
export const POOL_HOUR_VOLUME_GQL = volumeQuery('Hour');
export const POOL_MINUTE_VOLUME_GQL = volumeQuery('Minute');

export const POOL_FEES_GQL = gql`
  query poolFee(
    $address: String!
    $fromTime: String!
  ) {
    poolFee(
      address: $address
      fromTime: $fromTime
    ) {
      fee1
      fee2
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
  query poolEvent($address: String!) {
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

export const POOL_TRANSACTIONS_GQL = gql`
  subscription transactions(
    $search: String!
    $type: [PoolType!]
    $offset: Int!
    $limit: Int!
  ) {
    poolEvents(
      limit: $limit, 
      offset: $offset, 
      orderBy: timestamp_DESC, 
      where: {
        pool: {
          id_containsInsensitive: $search, 
          AND: { verified_eq: true }
        }, 
        AND: {type_in: $type}
      }
    ) {
      id
      amount1
      amount2
      amountIn1
      amountIn2
      senderAddress
      toAddress
      blockHeight
      indexInBlock
      timestamp
      type
      pool {
        decimal1
        decimal2
        symbol1
        symbol2
      }
      signerAddress
    }
  }
`;

export const POOL_TRANSACTION_COUNT_GQL = gql`
  query transactionCount(
    $search: String!
    $type: [PoolType!]
  ) {
    poolEventsConnection(
      orderBy: timestamp_DESC, 
      where: {
        pool: {
          id_containsInsensitive: $search, 
          AND: { verified_eq: true }
        }, 
        AND: {type_in: $type}
      }
    ) {
      totalCount
    }
  }
`;

// Charts queries & subscriptions
type Time = 'Day' | 'Hour' | 'Minute';

const tvlQuery = (time: Time): DocumentNode => gql`
  query poolSupply($address: String!, $fromTime: String!) {
    poolTimeSupplies(
      address: $address
      fromTime: $fromTime
      time: ${time}

      distinct_on: timestamp
      where: {
        poolId_eq: $address
        timeframe_gte: $fromTime
      }
      orderBy: timeframe_ASC
    ) {
      totalSupply
      timeframe
    }
  }
`;
export const POOL_DAY_TVL_GQL = tvlQuery('Day');
export const POOL_HOUR_TVL_GQL = tvlQuery('Hour');
export const POOL_MINUTE_TVL_GQL = tvlQuery('Minute');

const feeQuery = (time: Time): DocumentNode => gql`
  query fee($address: String!, $fromTime: String!) {
    poolTimeFees(
      address: $address
      fromTime: $fromTime
      time: ${time}
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

export const poolDataQuery = (time: Time): DocumentNode => gql`
  query poolData($address: String!, $fromTime: String!) {
    poolData(
      address: $address,
      fromTime: $fromTime
      time: "${time}"
    ) {
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
      allReserves {
        reserved1
        reserved2
        timeframe
      }
    }
  }
`;

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
      name1
      name2
    }
  }
`;

export const ALL_POOLS_LIST = gql`
  query allPoolsList($signerAddress: String!, $limit: Float!, $offset: Float!, $search: String!) {
    allPoolsList(signerAddress: $signerAddress, limit: $limit, offset: $offset, search: $search) {
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
  query allPoolsListCount($signerAddress: String!, $search: String!) {
    allPoolsListCount(signerAddress: $signerAddress, search: $search)
  }
`;

export const USER_POOLS_LIST = gql`
  query userPoolsList($signerAddress: String!, $limit: Float!, $offset: Float!, $search: String!) {
    userPoolsList(signerAddress: $signerAddress, limit: $limit, offset: $offset, search: $search) {
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
  query userPoolsListCount($signerAddress: String!, $search: String!) {
    userPoolsListCount(signerAddress: $signerAddress, search: $search)
  }
`;

export const USER_POOL_SUPPLY = gql`
  query userPoolSupply($token1: String!, $token2: String!, $signerAddress: String!) {
    userPoolSupply(token1: $token1, token2: $token2, signerAddress: $signerAddress) {
      address
      decimals
      reserved1
      reserved2
      totalSupply
      userSupply
    }
  }
`;