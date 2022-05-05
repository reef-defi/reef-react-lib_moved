import React, { useMemo } from 'react';
import { useSubscription, useQuery, gql } from '@apollo/client';
import { Components } from '@reef-defi/react-lib/';

import { utcDay, utcMinute, utcHour } from 'd3-time';
// @ts-ignore
import { timeFormat } from 'd3-time-format';
// @ts-ignore
import { format } from 'd3-format';

// @ts-ignore
import { Chart } from 'react-stockcharts';
// @ts-ignore
import { CandlestickSeries } from 'react-stockcharts/lib/series';
// @ts-ignore
import { MouseCoordinateX, CrossHairCursor, CurrentCoordinate } from 'react-stockcharts/lib/coordinates';
// @ts-ignore
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
// @ts-ignore
import { SingleValueTooltip } from 'react-stockcharts/lib/tooltip';
// @ts-ignore
import { timeIntervalBarWidth } from 'react-stockcharts/lib/utils';
import DefaultChart from './DefaultChart';
import { dropDuplicatesMultiKey, std } from '../../../utils/utils';

const { Loading } = Components.Loading;

interface CandlestickData {
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

interface CandlestickQuery {
  pool_hour_candlestick: CandlestickData[];
}

interface CandlestickVar {
  address: string;
  whereToken: number;
  fromTime: string;
}

interface OHLC {
  date: Date;
  open: number;
  close: number;
  high: number;
  low: number;
}

const DAY_CANDLESTICK_GQL = gql`
query candlestick($address: String!, $whereToken: Int!, $fromTime: timestamptz!) {
  pool_hour_candlestick(
    order_by: { timeframe: asc }
    where: { 
      pool: { address: { _ilike: $address } } 
      which_token: { _eq: $whereToken }
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

const token1Values = ({
  close_1, high_1, timeframe, low_1, open_1,
}: CandlestickData): OHLC => ({
  close: close_1,
  high: high_1,
  date: new Date(timeframe),
  low: low_1,
  open: open_1,
});
const token2Values = ({
  close_2, high_2, timeframe, low_2, open_2,
}: CandlestickData): OHLC => ({
  close: close_2,
  high: high_2,
  date: new Date(timeframe),
  low: low_2,
  open: open_2,
});

interface TokenCandlestickChart {
  whichToken: number;
  address: string;
}

const TokenCandlestickChart = ({ whichToken, address } : TokenCandlestickChart): JSX.Element => {
  const toDate = useMemo(() => Date.now(), []);
  const fromDate = toDate - 50 * 60 * 60 * 1000; // last 50 hour

  const { loading, data, error } = useQuery<CandlestickQuery, CandlestickVar>(
    DAY_CANDLESTICK_GQL,
    {
      variables: {
        address,
        whereToken: whichToken,
        fromTime: new Date(fromDate).toISOString(),
      },
    },
  );

  const candlestick = data
    ? data.pool_hour_candlestick
      .map((token) => (whichToken === 1 ? token1Values(token) : token2Values(token)))
      .filter(({ date }) => date.getTime() > fromDate)
    : [];

  const results = dropDuplicatesMultiKey(candlestick, ['date'])
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (loading) {
    return (<Loading />);
  }
  if (results.length <= 1) {
    return <span>Not enough data</span>;
  }
  const values = results.reduce((acc, { high, low }) => [...acc, high, low], [] as number[]);
  const adjust = std(values);

  return (
    <DefaultChart
      data={results}
      fromDate={new Date(fromDate)}
      toDate={new Date(toDate)}
      type="svg"
    >
      <Chart id={1} yExtents={(d: OHLC) => [d.high + adjust, d.low - adjust]}>
        <XAxis axisAt="bottom" orient="bottom" ticks={8} />
        <YAxis axisAt="left" orient="left" ticks={6} />

        <MouseCoordinateX
          at="bottom"
          orient="bottom"
          displayFormat={timeFormat('%Y-%m-%d %H:%M:%S')}
        />

        <CandlestickSeries width={timeIntervalBarWidth(utcHour)} />

        <CurrentCoordinate yAccessor={(d: OHLC) => d.close} fill={(d: OHLC) => d.close} />

        <SingleValueTooltip
          yAccessor={(d: OHLC) => d.close}
          yDisplayFormat={(d: number) => `${format('.4f')(d)}`}
          yLabel="Value"
          fontSize={21}
          origin={[20, 10]}
        />
        <SingleValueTooltip
          yAccessor={(d: OHLC) => d.date}
          fontSize={14}
          yLabel="Date"
          yDisplayFormat={timeFormat('%Y-%m-%d')}
          origin={[20, 30]}
        />
      </Chart>

      <CrossHairCursor />
    </DefaultChart>
  );
};

export default TokenCandlestickChart;
