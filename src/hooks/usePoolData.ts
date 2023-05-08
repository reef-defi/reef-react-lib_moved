import { ApolloClient, useQuery } from '@apollo/client';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { PoolDataQuery, PoolDataVar, poolDataQuery } from '../graphql/pools';
// import { BaseCandlestickData, BaseVolumeData, CandlestickData } from '../state';
import { BaseVolumeData } from '../state';
import { timeDataToMs, useFromTime } from './useFromTime';

interface Time {
  time: Date;
}
interface Timeframe {
  timeframe: string;
}
interface BaseDataHolder extends Time {
  value: number;
}
// interface CandlestickHolder extends BaseCandlestickData, Time { }
interface Amounts extends Timeframe, BaseVolumeData { }

export interface PoolDataTime {
  fees: BaseDataHolder[];
  volume: BaseDataHolder[];
  price: BaseDataHolder[];
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
  resolvePrev: (prev: T, last: Date) => T
): T[] => [
  ...data,
  { ...end },
]
  .reduce((acc, item) => {
    const last = acc[acc.length - 1];
    let lastDate = new Date(last.time.getTime() + timeDataToMs({ timeUnit, timeSpan: 1 }));

    while (lastDate < item.time) {
      acc.push(resolvePrev(last, lastDate));
      lastDate = new Date(lastDate.getTime() + timeDataToMs({ timeUnit, timeSpan: 1 }));
    }
    acc.push({ ...item });
    return acc;
  },
  [start])
  .slice(1, -1);

// const processCandlestick = (data: CandlestickData[], prevClose: number, timeData: TimeData): CandlestickHolder[] => fillMissingDates(
//   data.map((item) => ({ ...item, time: new Date(item.timeframe) })), // data
//   {
//     close: prevClose,
//     high: prevClose,
//     low: prevClose,
//     open: prevClose,
//     time: new Date(Date.now() - timeDataToMs({ timeUnit: timeData.timeUnit, timeSpan: timeData.timeSpan })),
//     timeframe: new Date().toString(),
//   }, // start
//   {
//     close: 0,
//     high: 0,
//     open: 0,
//     low: 0,
//     time: new Date(),
//     timeframe: new Date().toString(),
//   }, // end
//   timeData.timeUnit, // timeUnit
//   ({ close }, lastDate) => ({
//     close,
//     high: close,
//     low: close,
//     open: close,
//     time: new Date(lastDate),
//     timeframe: new Date().toString(),
//   }), // resolvePrev
// );

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
  timeData: TimeData;
}

export const usePoolData = ({
  address, decimal1, decimal2, price1, price2, timeData = { timeUnit: 'Day', timeSpan: 30 },
}: UsePoolData, dexClient: ApolloClient<any>): UsePoolDataOutput => {
  const { fromTime, toTime } = useFromTime(timeData.timeUnit, timeData.timeSpan);
  
  const { data, loading } = useQuery<PoolDataQuery, PoolDataVar>(
    poolDataQuery(timeData.timeUnit),
    {
      client: dexClient,
      variables: {
        address,
        fromTime: fromTime.toISOString(),
      },
    },
  );

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

    const process = defaultProcess(price1, price2, decimal1, decimal2);

    const volume = fillMissingDates(
      data.poolData.volume.map(process),
      { value: 0, time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      ({}, lastDate) => ({ value: 0, time: lastDate }),
    );

    const firstTokenVolume = fillMissingDates(
      data.poolData.volume.map((item) => ({
        time: new Date(item.timeframe),
        value: new BigNumber(item.amount1)
          .div(new BigNumber(10).pow(decimal1))
          .multipliedBy(price1)
          .toNumber(),
      })),
      { value: 0, time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      ({}, lastDate) => ({ value: 0, time: lastDate }),
    );

    const secondTokenVolume = fillMissingDates(
      data.poolData.volume.map((item) => ({
        time: new Date(item.timeframe),
        value: new BigNumber(item.amount2)
          .div(new BigNumber(10).pow(decimal2))
          .multipliedBy(price2)
          .toNumber(),
      })),
      { value: 0, time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      ({}, lastDate) => ({ value: 0, time: lastDate }),
    );

    const fees = fillMissingDates(
      data.poolData.fee
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

    const tvl = fillMissingDates(
      data.poolData.reserves
        .map(({ reserved1, reserved2, timeframe }): Amounts => ({
          timeframe,
          amount1: reserved1,
          amount2: reserved2,
        }))
        .map(process),
      { value: data.poolData.previousReserves.timeframe 
          ? new BigNumber(data.poolData.previousReserves.reserved1)
          .div(new BigNumber(10).pow(decimal1))
          .multipliedBy(price1)
          .plus(
            new BigNumber(data.poolData.previousReserves.reserved2)
              .div(new BigNumber(10).pow(decimal2))
              .multipliedBy(price2),
          )
          .toNumber() 
          : 0, 
        time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      (last, lastDate) => ({ value: last.value, time: lastDate }),
    );

    const processPrices = (decimal1: number, decimal2: number) => ({ timeframe, amount1, amount2 }: Amounts): BaseDataHolder => ({
      time: new Date(timeframe),
      value: new BigNumber(amount1)
        .div(new BigNumber(10).pow(decimal1))
        .div(
          new BigNumber(amount2)
            .div(new BigNumber(10).pow(decimal2))
        )
        .toNumber(),
    });

    const price = fillMissingDates(
      data.poolData.reserves
        .map(({ reserved1, reserved2, timeframe }): Amounts => ({
          timeframe,
          amount1: reserved1,
          amount2: reserved2,
        }))
        .map(processPrices(decimal1, decimal2)),
      { value: data.poolData.previousReserves.timeframe 
          ? new BigNumber(data.poolData.previousReserves.reserved1)
            .div(new BigNumber(10).pow(decimal1))
            .div(
              new BigNumber(data.poolData.previousReserves.reserved2)
                .div(new BigNumber(10).pow(decimal2))
            )
            .toNumber()
          :0, 
          time: fromTime },
      { value: 0, time: toTime },
      timeData.timeUnit,
      (last, lastDate) => ({ value: last.value, time: lastDate }),
    );

    return {
      price,
      fees,
      volume,
      tvl,
      firstTokenVolume,
      secondTokenVolume,
    };
  }, [data, price1, price2, decimal1, decimal2]);

  return [processed, loading];
};
