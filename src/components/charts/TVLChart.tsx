import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Components } from '@reef-defi/react-lib';
// @ts-ignore
import { timeFormat } from 'd3-time-format';
// @ts-ignore
import { Chart } from 'react-stockcharts';
// @ts-ignore
import { MouseCoordinateX, CrossHairCursor, CurrentCoordinate } from 'react-stockcharts/lib/coordinates';
// @ts-ignore
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
// @ts-ignore
import { SingleValueTooltip } from 'react-stockcharts/lib/tooltip';
import './Chart.css';
// @ts-ignore
import { ScatterSeries, SquareMarker, LineSeries } from 'react-stockcharts/lib/series';
import { AddressVar } from '../poolTypes';
import {
  dropDuplicatesMultiKey, formatAmount, std, toTimestamp,
} from '../../../utils/utils';
import DefaultChart from './DefaultChart';

const { Loading } = Components.Loading;

interface TVLChart {
  address: string;
}

const TVL_GQL = gql`
query pool_supply($address: String!, $fromTime: timestamptz!) {
  pool_hour_supply(
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

interface TVLData {
  total_supply: number;
  timeframe: string;
}

type TVLQuery = { pool_hour_supply: TVLData[] }
interface TVlVar extends AddressVar {
  fromTime: string;
}

interface Data {
  amount: number;
  date: string;
}

const TVLChart = ({ address } : TVLChart): JSX.Element => {
  const toDate = useMemo(() => Date.now(), []);
  const fromDate = toDate - 50 * 60 * 60 * 1000; // last 50 hour

  const { loading, data } = useQuery<TVLQuery, TVlVar>(
    TVL_GQL,
    {
      variables: {
        address,
        fromTime: new Date(fromDate).toISOString(),
      },
    },
  );

  const tvl = data
    ? data.pool_hour_supply
      .map(({ timeframe, total_supply }) => ({
        date: new Date(timeframe),
        amount: total_supply,
      }))
    : [];

  if (tvl.length > 0 && toDate - tvl[tvl.length - 1].date.getTime() > 1000 * 60) {
    tvl.push({ ...tvl[tvl.length - 1], date: new Date(toDate) });
  }
  const filteredData = dropDuplicatesMultiKey(tvl, ['date'])
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (loading) {
    return (<Loading />);
  }
  if (filteredData.length <= 1) {
    return <span>Not enough data</span>;
  }

  const values: number[] = tvl.map(({ amount }) => amount);
  const adjust = std(values);

  return (
    <DefaultChart
      data={filteredData}
      fromDate={new Date(fromDate)}
      toDate={new Date(toDate)}
      type="svg"
    >
      <Chart id={1} yExtents={(d: Data) => [d.amount + adjust, d.amount - adjust]}>
        <XAxis axisAt="bottom" orient="bottom" ticks={8} />
        <YAxis
          axisAt="left"
          orient="left"
          ticks={6}
          displayFormat={(d: number) => formatAmount(d, 18)}
        />

        <MouseCoordinateX
          at="bottom"
          orient="bottom"
          displayFormat={timeFormat('%Y-%m-%d %H:%M:%S')}
        />
        <LineSeries
          yAccessor={(d: Data) => d.amount}
          stroke="#ff7f0e"
          strokeDasharray="Solid"
        />
        <ScatterSeries
          yAccessor={(d: Data) => d.amount}
          marker={SquareMarker}
          markerProps={{ width: 6, stroke: '#ff7f0e', fill: '#ff7f0e' }}
        />
        <CurrentCoordinate yAccessor={(d: Data) => d.amount} fill={(d: Data) => d.amount} />

        <SingleValueTooltip
          yAccessor={(d: Data) => d.amount}
          yDisplayFormat={(d: number) => formatAmount(d, 18)}
          fontSize={21}
          origin={[20, 10]}
        />
        <SingleValueTooltip
          yAccessor={(d: Data) => d.date}
          fontSize={14}
          yDisplayFormat={timeFormat('%Y-%m-%d %H:%M:%S')}
          origin={[20, 30]}
        />
      </Chart>

      <CrossHairCursor />
    </DefaultChart>
  );
};

export default TVLChart;
