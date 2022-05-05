import { gql } from "@apollo/client";

// Data interfaces
export type BasePoolTransactionTypes = "Swap" | "Mint" | "Burn";
export type TransactionTypes = BasePoolTransactionTypes | "All";

interface Supply {
  total_supply: number;
  supply: number;
}
interface Volume {
  amount_1: number;
  amount_2: number;
}
interface Fee {
  fee_1: number;
  fee_2: number;
}

interface Reserves {
  reserved_1: number;
  reserved_2: number;
  total_supply: number;
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
  volume_aggregate: { aggregate: { sum: Volume } };
}

interface PoolData {
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

// Query result interfaces
export type VolumeQuery = {
  pool_hour_volume_aggregate: { aggregate: { sum: Volume } };
};
export type SupplyQuery = { pool_minute_supply: Supply[] };
export type FeeQuery = {
  pool_hour_fee_aggregate: {
    aggregate: {
      sum: Fee;
    };
  };
};

export type PoolQuery = { pool: PoolData[] };
export type PoolsQuery = { verified_pool: Pool[] };
export type ReservesQuery = { pool_event: Reserves[] };
export type PoolTransactionQuery = { verified_pool_event: PoolTransaction[] };
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

// Query variable interfaces
export interface FromVar {
  fromTime: string;
}

export interface AddressVar {
  address: string;
}

export interface FeeVar extends FromVar, AddressVar {}
export interface VolumeVar extends FeeVar {
  toTime: string;
}
export interface OptionalSearchVar {
  search: { _ilike?: string };
}
export interface PoolVar extends FromVar, OptionalSearchVar {
  offset: number;
}

export interface BasicTransactionVar {
  address: { _ilike?: string };
  type: BasePoolTransactionTypes[];
}

export interface TransactionVar extends BasicTransactionVar {
  offset: number;
  limit: number;
}

// Graphql statements
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

export const POOL_VOLUME_GQL = gql`
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
      volume_aggregate(where: { timeframe: { _gte: $fromTime } }) {
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
    $address: String_comparison_exp!
    $type: [pooltype!]
    $offset: Int!
    $limit: Int!
  ) {
    verified_pool_event(
      order_by: { timestamp: desc }
      where: { pool: { address: $address }, type: { _in: $type } }
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
    $address: String_comparison_exp!
    $type: [pooltype]!
  ) {
    verified_pool_event_aggregate(
      where: { pool: { address: $address }, type: { _in: $type } }
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
