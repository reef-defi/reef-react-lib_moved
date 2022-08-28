import { useQuery } from '@apollo/client';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { PoolDataQuery, PoolDataVar, POOL_DATA_GQL } from '../graphql/pools';
import { BaseCandlestickData, BaseVolumeData, CandlestickData } from '../state';
import { useFromTime } from './useFromTime';

interface Time {
  time: Date;
}
interface Timeframe {
  timeframe: string;
}
interface BaseDataHolder extends Time {
  value: number;
}
interface CandlestickHolder extends BaseCandlestickData, Time { }
interface Amounts extends Timeframe, BaseVolumeData { }

interface PoolData {
  fees: BaseDataHolder[];
  volume: BaseDataHolder[];
  firstToken: CandlestickHolder[];
  secondToken: CandlestickHolder[];
  tvl: BaseDataHolder[];
}
type UsePoolDataOutput = [PoolData, boolean];

const emptyHolder = (days = 0): BaseDataHolder => ({
  time: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
  value: 0,
});

const fillMissingDates = <T extends Time>(data: T[], start: T, end: T, resolvePrev: (prev: T, last: Date) => T): T[] => [
  ...data,
  { ...end },
]
  .reduce((acc, item) => {
    const last = acc[acc.length - 1];
    const lastDate = new Date(last.time);
    lastDate.setDate(lastDate.getDate() + 1);

    while (lastDate < item.time) {
      acc.push(resolvePrev(last, lastDate));
      lastDate.setDate(lastDate.getDate() + 1);
    }
    acc.push({ ...item });
    return acc;
  },
  [start])
  .slice(1, -1);

const processCandlestick = (data: CandlestickData[], prevClose: number, days: number): CandlestickHolder[] => fillMissingDates(
  data.map((item) => ({ ...item, time: new Date(item.timeframe) })),
  {
    close: prevClose,
    high: prevClose,
    low: prevClose,
    open: prevClose,
    time: new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000),
    timeframe: new Date().toString(),
  },
  {
    close: 0,
    high: 0,
    open: 0,
    low: 0,
    time: new Date(),
    timeframe: new Date().toString(),
  },
  ({ close }, lastDate) => ({
    close,
    high: close,
    low: close,
    open: close,
    time: new Date(lastDate),
    timeframe: new Date().toString(),
  }),
);

const defaultProcess = (price1: number, price2: number, decimal1: number, decimal2: number) => ({ timeframe, amount1, amount2 }: Amounts): BaseDataHolder => ({
  time: new Date(timeframe),
  value: new BigNumber(amount1)
    .div(new BigNumber(10).pow(decimal1))
    .multipliedBy(price1)
    .plus(
      new BigNumber(amount2)
        .div(new BigNumber(10).pow(decimal2))
        .multipliedBy(price2),
    )
    .toNumber(),
});

interface UsePoolData {
  address: string;
  price1: number;
  price2: number;
  decimal1: number;
  decimal2: number;
  days?: number;
}

export const usePoolData = ({
  address, decimal1, decimal2, price1, price2, days = 31,
}: UsePoolData): UsePoolDataOutput => {
  const fromTime = useFromTime(days);

  const { data, loading } = useQuery<PoolDataQuery, PoolDataVar>(
    POOL_DATA_GQL,
    {
      variables: {
        address,
        fromTime: new Date(fromTime).toISOString(),
      },
    },
  );

  const processed = useMemo((): PoolData => {
    if (!data) {
      return {
        firstToken: [],
        secondToken: [],
        fees: [],
        tvl: [],
        volume: [],
      };
    }

    const process = defaultProcess(price1, price2, decimal1, decimal2);

    const firstToken = processCandlestick(
      data.candlestick1,
      data.previousCandlestick1.length > 0 ? data.previousCandlestick1[0].close : 0,
      days,
    );

    const secondToken = processCandlestick(
      data.candlestick2,
      data.previousCandlestick2.length > 0 ? data.previousCandlestick2[0].close : 0,
      days,
    );
    const volume = fillMissingDates(
      data.volume.map(process),
      emptyHolder(days - 1),
      emptyHolder(),
      ({}, lastDate) => ({ value: 0, time: new Date(lastDate) }),
    );
    const fees = fillMissingDates(
      data.fee
        .map(({ fee1, fee2, timeframe }): Amounts => ({
          timeframe,
          amount1: fee1,
          amount2: fee2,
        }))
        .map(process),
      emptyHolder(days - 1),
      emptyHolder(),
      ({}, lastDate) => ({ value: 0, time: new Date(lastDate) }),
    );
    const tvl = fillMissingDates(
      data.reserves
        .map(({ reserved1, reserved2, timeframe }): Amounts => ({
          timeframe,
          amount1: reserved1,
          amount2: reserved2,
        }))
        .map(process),
      emptyHolder(days - 1),
      emptyHolder(),
      (last, lastDate) => ({ value: last.value, time: new Date(lastDate) }),
    );

    return {
      firstToken,
      secondToken,
      fees,
      volume,
      tvl,
    };
  }, [data, price1, price2, decimal1, decimal2]);

  return [processed, loading];
};
