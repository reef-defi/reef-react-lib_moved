import React, { useMemo } from 'react';
// @ts-ignore
import { timeFormat } from 'd3-time-format';
// @ts-ignore
import { Chart } from 'react-stockcharts';
// @ts-ignore
import { CrossHairCursor, CurrentCoordinate, MouseCoordinateX } from 'react-stockcharts/lib/coordinates';
// @ts-ignore
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
// @ts-ignore
import './Chart.css';
// @ts-ignore
import { LineSeries, ScatterSeries, SquareMarker } from 'react-stockcharts/lib/series';
// import {
//   dropDuplicatesMultiKey, formatAmount, std, toTimestamp,
// } from '../../../utils/utils';
import { useDayTvl } from '../../hooks';
import { formatAmount, std } from '../../utils/math';
import { dropDuplicatesMultiKey } from '../../utils/utils';
import { Loading } from '../common/Loading';
import DefaultChart from './DefaultChart';

interface TVLChart {
  address: string;
}

interface Data {
  amount: number;
  date: string;
}

const TVLChart = ({ address } : TVLChart): JSX.Element => {
  const toDate = useMemo(() => Date.now(), []);
  const fromDate = toDate - 31 * 24 * 60 * 60 * 1000; // last 50 hour

  const { loading, data } = useDayTvl(address, fromDate);

  const tvl = data
    ? data.pool_day_supply
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
  console.log(filteredData)
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

        {/* TODO find wtf is wrong with this */}
        {/* <SingleValueTooltip
          yAccessor={(d: Data) => d.amount || 0}
          yDisplayFormat={(d: number) => formatAmount(d, 18)}
          fontSize={21}
          origin={[20, 10]}
        /> */}
        {/* <SingleValueTooltip
          yAccessor={(d: Data) => d.date}
          fontSize={14}
          yDisplayFormat={timeFormat('%Y-%m-%d %H:%M:%S')}
          origin={[20, 30]}
        /> */}
      </Chart>

      <CrossHairCursor />
    </DefaultChart>
  );
};

export default TVLChart;
