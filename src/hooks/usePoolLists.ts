import axios, { AxiosResponse } from 'axios';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';
import { TokenPrices } from '../state';
import { getIconUrl } from '../utils';
import { useAsyncEffect } from './useAsyncEffect';

const ALL_POOLS_LIST_ENDPOINT = '/api/pools/list';
const USER_POOLS_LIST_ENDPOINT = '/api/pools/users-list';
const ALL_POOLS_LIST_COUNT_ENDPOINT = '/api/pools/list-count';
const USER_POOLS_LIST_COUNT_ENDPOINT = '/api/pools/users-list-count';

interface ContractData {
  name: string;
  symbol: string;
  decimals: number
}
interface PoolListItemReq {
  address: string;
  token_1: string;
  token_2: string;
  reserved_1: string;
  reserved_2: string;
  contract_data_1: ContractData;
  contract_data_2: ContractData;
  day_volume_1: string | null;
  day_volume_2: string | null;
  prev_day_volume_1: string | null;
  prev_day_volume_2: string | null;
  user_locked_amount_1: string | null;
  user_locked_amount_2: string | null;
}
interface PoolsListReqVar {
  limit: number;
  offset: number;
  signer: string;
  search: string | undefined;
}

interface QueryPoolList {
  limit: number;
  search: string;
  signer: string;
  offset: number;
  reefscanApi: string;
}

interface PoolItem {
  address: string;
  tvl: string;
  volume24h: string;
  volumeChange24h: number;
  myLiquidity?: string;
  token1: {
    name: string;
    image: string;
  };
  token2: {
    name: string;
    image: string;
  };
}

const defaultPoolQuery = async <Res>(
  endpoint: string,
  {
    limit,
    offset,
    reefscanApi,
    search,
    signer,
  }: QueryPoolList,
): Promise<Res> => axios.post<PoolsListReqVar, AxiosResponse<Res>>(
  `${reefscanApi}${endpoint}`,
  {
    limit,
    offset,
    signer,
    search: search === '' ? undefined : search,
  },
).then((res) => res.data);

const queryPoolList = async (args: QueryPoolList): Promise<PoolListItemReq[]> => defaultPoolQuery(ALL_POOLS_LIST_ENDPOINT, args);

const queryUserPoolList = async (args: QueryPoolList): Promise<PoolListItemReq[]> => defaultPoolQuery(USER_POOLS_LIST_ENDPOINT, args);

const queryPoolListCount = async (args: QueryPoolList): Promise<number> => defaultPoolQuery(ALL_POOLS_LIST_COUNT_ENDPOINT, args);

const queryUserPoolListCount = async (args: QueryPoolList): Promise<number> => defaultPoolQuery(USER_POOLS_LIST_COUNT_ENDPOINT, args);

interface UsePoolsList extends QueryPoolList {
  tokenPrices: TokenPrices;
  queryType: 'All' | 'User';
}

const calculate24hVolumeUSD = (
  {
    token_1,
    token_2,
    day_volume_1,
    day_volume_2,
    prev_day_volume_1,
    prev_day_volume_2,
    contract_data_1: { decimals: decimal1 },
    contract_data_2: { decimals: decimal2 },
  }: PoolListItemReq,
  tokenPrices: TokenPrices,
  current: boolean,
): BigNumber => {
  const v1 = current ? day_volume_1 : prev_day_volume_1;
  const v2 = current ? day_volume_2 : prev_day_volume_2;
  if (v1 === null && v2 === null) return new BigNumber(0);
  const dv1 = new BigNumber(v1 === null ? 0 : v1)
    .div(new BigNumber(10).pow(decimal1))
    .multipliedBy(tokenPrices[token_1]);
  const dv2 = new BigNumber(v2 === null ? 0 : v2)
    .div(new BigNumber(10).pow(decimal2))
    .multipliedBy(tokenPrices[token_2]);

  return dv1.plus(dv2);
};

const calculateVolumeChange = (pool: PoolListItemReq, tokenPrices: TokenPrices): number => {
  const current = calculate24hVolumeUSD(pool, tokenPrices, true);
  const previous = calculate24hVolumeUSD(pool, tokenPrices, false);
  if (previous.eq(0) && current.eq(0)) return 0;
  if (previous.eq(0)) return 100;
  if (current.eq(0)) return -100;
  const res = current.minus(previous).div(previous).multipliedBy(100);
  return res.toNumber();
};

const calculateUSDTVL = ({
  reserved_1,
  reserved_2,
  contract_data_1: { decimals: decimal1 },
  contract_data_2: { decimals: decimal2 },
  token_1,
  token_2,
}: PoolListItemReq,
tokenPrices: TokenPrices): string => {
  const r1 = new BigNumber(reserved_1).div(new BigNumber(10).pow(decimal1)).multipliedBy(tokenPrices[token_1]);
  const r2 = new BigNumber(reserved_2).div(new BigNumber(10).pow(decimal2)).multipliedBy(tokenPrices[token_2]);
  return r1.plus(r2).toFormat(2); // TODO Hudlajf add formating. You can use toFormat function
};

const calculateUserLiquidity = (
  {
    token_1, token_2, user_locked_amount_1, user_locked_amount_2, contract_data_1: { decimals: decimal1 }, contract_data_2: { decimals: decimal2 },
  }: PoolListItemReq,
  tokenPrices: TokenPrices,
): string|undefined => {
  const v1 = new BigNumber(user_locked_amount_1 === null ? '0' : user_locked_amount_1)
    .div(new BigNumber(10).pow(decimal1))
    .multipliedBy(tokenPrices[token_1]);
  const v2 = new BigNumber(user_locked_amount_2 === null ? '0' : user_locked_amount_2)
    .div(new BigNumber(10).pow(decimal2))
    .multipliedBy(tokenPrices[token_2]);
  const res = v1.plus(v2);

  return res.gt(0) ? res.toFormat(2) : undefined;
};

export const usePoolsList = ({
  limit, offset, reefscanApi, search, signer, tokenPrices, queryType,
}: UsePoolsList): [PoolItem[], boolean, number] => {
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [poolsReq, setPoolsReq] = useState<PoolListItemReq[]>([]);

  useAsyncEffect(async () => {
    if (reefscanApi === '') { return; }
    const queryArgs = {
      limit, offset, reefscanApi, search, signer,
    };

    Promise.resolve()
      .then(() => setIsLoading(true))
      .then(() => (queryType === 'User'
        ? queryUserPoolList(queryArgs)
        : queryPoolList(queryArgs)))
      .then((res) => setPoolsReq(res))
      .catch((err) => {
        console.error('Something went wrong when loading pools');
        console.error(err);
      })
      .finally(() => setIsLoading(false));

    Promise.resolve()
      .then(() => (queryType === 'User'
        ? queryUserPoolListCount(queryArgs)
        : queryPoolListCount(queryArgs)))
      .then((ctn) => setCount(ctn));
  }, [limit, offset, search, signer, reefscanApi]);

  useEffect(() => {
    setPools(
      poolsReq.map((pool) => ({
        address: pool.address,
        token1: {
          image: getIconUrl(pool.token_1),
          name: pool.contract_data_1.symbol,
        },
        token2: {
          image: getIconUrl(pool.token_2),
          name: pool.contract_data_2.symbol,
        },
        tvl: calculateUSDTVL(pool, tokenPrices),
        volume24h: calculate24hVolumeUSD(pool, tokenPrices, true).toFormat(2),
        volumeChange24h: calculateVolumeChange(pool, tokenPrices),
        myLiquidity: calculateUserLiquidity(pool, tokenPrices),
      })),
    );
  }, [poolsReq, tokenPrices]);

  return [pools, isLoading, count];
};
