import { ApolloClient, useQuery } from '@apollo/client';
import BigNumber from 'bignumber.js';
import { useEffect, useMemo } from 'react';
import { PoolDataQuery, PoolDataVar, poolDataQuery } from '../graphql/pools';
import { BaseCandlestickData, BaseVolumeData, CandlestickData } from '../state';
import { calcTimeRange, timeDataToMs, truncateDate } from './useFromTime';

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

export interface PoolDataTime {
  fees: BaseDataHolder[];
  volume: BaseDataHolder[];
  price: CandlestickHolder[];
  tvl: BaseDataHolder[];
  firstTokenVolume: BaseDataHolder[];
  secondTokenVolume: BaseDataHolder[];
}
type UsePoolDataOutput = [PoolDataTime, boolean];

export type TimeUnit = 'Day' | 'Hour' | 'Minute';
export interface TimeData {
  timeUnit: TimeUnit;
  timeSpan: number;
}

const fillMissingDates = <T extends Time>(
  data: T[],
  start: T,
  end: T,
  timeUnit: TimeUnit,
  resolvePrev: (prev: T, last: Date) => T,
): T[] => [
    ...data,
    { ...end },
  ]
    .reduce((acc, item) => {
      const last = acc[acc.length - 1];

      let lastDate = new Date(last.time.getTime());
      if (acc.length > 1) {
        lastDate = new Date(lastDate.getTime() + timeDataToMs({ timeUnit, timeSpan: 1 }));
      }

      while (lastDate < item.time) {
        acc.push(resolvePrev(last, lastDate));
        lastDate = new Date(lastDate.getTime() + timeDataToMs({ timeUnit, timeSpan: 1 }));
      }
      acc.push({ ...item });
      return acc;
    },
    [start])
    .slice(1, -1);

const processCandlestick = (
  data: CandlestickData[],
  prevClose: BaseDataHolder,
  toTime: Date,
  timeData: TimeData,
): CandlestickHolder[] => fillMissingDates(
  data.map((item) => ({ ...item, time: new Date(item.timeframe) })), // data
  {
    close: prevClose.value,
    high: prevClose.value,
    low: prevClose.value,
    open: prevClose.value,
    time: prevClose.time,
    timeframe: prevClose.time.toISOString(),
  }, // start
  {
    close: 0,
    high: 0,
    open: 0,
    low: 0,
    time: toTime,
    timeframe: toTime.toISOString(),
  }, // end
  timeData.timeUnit, // timeUnit
  ({ close }, lastDate) => ({
    close,
    high: close,
    low: close,
    open: close,
    time: new Date(lastDate),
    timeframe: new Date(lastDate).toISOString(),
  }), // resolvePrev
);

const groupByTimeframe = (data: BaseDataHolder[], timeUnit: TimeUnit): BaseDataHolder[][] => {
  if (data.length === 0) return [];
  const groups: BaseDataHolder[][] = [];
  let currentGroup: BaseDataHolder[] = [];
  let currentGroupStartTime = truncateDate(new Date(data[0].time), timeUnit).getTime();

  const timeframe = timeDataToMs({ timeUnit, timeSpan: 1 });

  for (const obj of data) {
    if (obj.time.getTime() >= currentGroupStartTime + timeframe) {
      groups.push(currentGroup);
      currentGroup = [];
      currentGroupStartTime = truncateDate(new Date(obj.time), timeUnit).getTime();
    }
    currentGroup.push(obj);
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

function calculateCandlesticks(
  data: BaseDataHolder[][],
  timeUnit: TimeUnit,
  prev: BaseDataHolder,
): CandlestickData[] {
  const candlesticks: CandlestickData[] = [];

  for (const group of data) {
    const open = candlesticks.length ? candlesticks[candlesticks.length - 1].close : prev.value;
    const close = group[group.length - 1].value;
    let high = open;
    let low = open;
    const timeframe = group[0].time;

    for (const obj of group) {
      if (obj.value > high) {
        high = obj.value;
      }
      if (obj.value < low) {
        low = obj.value;
      }
    }

    candlesticks.push({
      open, close, high, low, timeframe: truncateDate(timeframe, timeUnit).toISOString(),
    });
  }

  return candlesticks;
}

const defaultProcess = (price1: number, price2: number, decimals1: number, decimals2: number) => ({ timeframe, amount1, amount2 }: Amounts): BaseDataHolder => ({
  time: new Date(timeframe),
  value: new BigNumber(amount1)
    .div(new BigNumber(10).pow(decimals1))
    .multipliedBy(price1)
    .plus(
      new BigNumber(amount2)
        .div(new BigNumber(10).pow(decimals2))
        .multipliedBy(price2),
    )
    .toNumber(),
});

interface UsePoolData {
  address: string;
  price1: number;
  price2: number;
  decimals1: number;
  decimals2: number;
  timeData: TimeData;
}

export const usePoolData = ({
  address, decimals1, decimals2, price1, price2, timeData = { timeUnit: 'Day', timeSpan: 31 },
}: UsePoolData, dexClient: ApolloClient<any>): UsePoolDataOutput => {
  const { fromTime, toTime } = calcTimeRange(timeData.timeUnit, timeData.timeSpan);

  // ********************* Get pool data from GraphQL **************************************
  const { data, loading, refetch } = useQuery<PoolDataQuery, PoolDataVar>(
    poolDataQuery(timeData.timeUnit),
    {
      client: dexClient,
      variables: {
        address,
        fromTime: fromTime.toISOString(),
      },
    },
  );
  useEffect(() => {
    refetch();
  }, [timeData, refetch]);

  const processed = useMemo((): PoolDataTime => {
    if (!data) {
      return {
        price: [],
        fees: [],
        tvl: [],
        volume: [],
        firstTokenVolume: [],
        secondTokenVolume: [],
      };
    }

    const { poolData } = data;
    const process = defaultProcess(price1, price2, decimals1, decimals2);

    // *********************** Process volume ******************************************
    const volume = fillMissingDates(
      poolData.volume.map(process),
      { value: 0, time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      ({}, lastDate) => ({ value: 0, time: lastDate }),
    );

    const firstTokenVolume = fillMissingDates(
      poolData.volume.map((item) => ({
        time: new Date(item.timeframe),
        value: new BigNumber(item.amount1)
          .div(new BigNumber(10).pow(decimals1))
          .multipliedBy(price1)
          .toNumber(),
      })),
      { value: 0, time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      ({}, lastDate) => ({ value: 0, time: lastDate }),
    );

    const secondTokenVolume = fillMissingDates(
      poolData.volume.map((item) => ({
        time: new Date(item.timeframe),
        value: new BigNumber(item.amount2)
          .div(new BigNumber(10).pow(decimals2))
          .multipliedBy(price2)
          .toNumber(),
      })),
      { value: 0, time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      ({}, lastDate) => ({ value: 0, time: lastDate }),
    );

    // *********************** Process fees ********************************************
    const fees = fillMissingDates(
      poolData.fee
        .map(({ fee1, fee2, timeframe }): Amounts => ({
          timeframe,
          amount1: fee1,
          amount2: fee2,
        }))
        .map(process),
      { value: 0, time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      ({}, lastDate) => ({ value: 0, time: lastDate }),
    );

    // ************************** TVL **************************************************
    const prevTvl = {
      value: poolData.previousReserves.timeframe
        ? new BigNumber(poolData.previousReserves.reserved1)
          .div(new BigNumber(10).pow(decimals1))
          .multipliedBy(price1)
          .plus(
            new BigNumber(poolData.previousReserves.reserved2)
              .div(new BigNumber(10).pow(decimals2))
              .multipliedBy(price2),
          )
          .toNumber()
        : 0,
      time: fromTime,
    };

    let tvl = groupByTimeframe(
      poolData.allReserves
        .map(({ reserved1, reserved2, timeframe }): Amounts => ({
          timeframe,
          amount1: reserved1,
          amount2: reserved2,
        }))
        .map(process),
      timeData.timeUnit,
    ).map((group) => {
      const close = group[group.length - 1];
      return {
        value: close.value,
        time: truncateDate(close.time, timeData.timeUnit),
      };
    });
    tvl = fillMissingDates(
      tvl,
      prevTvl,
      { value: 0, time: toTime },
      timeData.timeUnit,
      (last, lastDate) => ({ value: last.value, time: lastDate }),
    );

    // ************************** Prices *********************************************
    const processPrices = (decimals1: number, decimals2: number) => ({ timeframe, amount1, amount2 }: Amounts): BaseDataHolder => ({
      time: new Date(timeframe),
      value: new BigNumber(amount1)
        .div(new BigNumber(10).pow(decimals1))
        .div(
          new BigNumber(amount2)
            .div(new BigNumber(10).pow(decimals2)),
        )
        .toNumber(),
    });

    const prevPrice = {
      value: poolData.previousReserves.timeframe
        ? new BigNumber(poolData.previousReserves.reserved1)
          .div(new BigNumber(10).pow(decimals1))
          .div(
            new BigNumber(poolData.previousReserves.reserved2)
              .div(new BigNumber(10).pow(decimals2)),
          )
          .toNumber()
        : 0,
      time: fromTime,
    };

    const allPrices = poolData.allReserves
      .map(({ reserved1, reserved2, timeframe }): Amounts => ({
        timeframe,
        amount1: reserved1,
        amount2: reserved2,
      }))
      .map(processPrices(decimals1, decimals2));

    const allPricesGrouped: BaseDataHolder[][] = groupByTimeframe(allPrices, timeData.timeUnit);
    const pricesCandlesticks = calculateCandlesticks(allPricesGrouped, timeData.timeUnit, prevPrice);
    const price = processCandlestick(pricesCandlesticks, prevPrice, toTime, timeData);

    return {
      price,
      fees,
      volume,
      tvl,
      firstTokenVolume,
      secondTokenVolume,
    };
  }, [data, price1, price2, decimals1, decimals2]);

  return [processed, loading];
};
