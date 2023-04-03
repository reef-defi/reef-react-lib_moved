import React, { useMemo } from 'react';
// @ts-ignore
import { timeFormat } from 'd3-time-format';
// @ts-ignore
import { Chart } from 'react-stockcharts';
// @ts-ignore
import { CrossHairCursor, CurrentCoordinate, MouseCoordinateX } from 'react-stockcharts/lib/coordinates';
// @ts-ignore
import { GroupedBarSeries } from 'react-stockcharts/lib/series';

// @ts-ignore
import { scaleOrdinal, schemeCategory10 } from 'd3-scale';
// @ts-ignore
import { set } from 'd3-collection';
// @ts-ignore
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
// @ts-ignore
import { SingleValueTooltip } from 'react-stockcharts/lib/tooltip';
import { useDayPoolFee } from '../../hooks';
import { BasicPoolInfo } from '../../state/pool';
import { formatAmount, std } from '../../utils/math';
import { Loading } from '../common/Loading';
import DefaultChart from './DefaultChart';

interface Data {
  fee_1: number;
  fee_2: number;
  date: string;
}

const FeeChart = ({
  address, symbol1, symbol2, decimal1, decimal2,
} : BasicPoolInfo): JSX.Element => {
  const toDate = Date.now();
  const fromDate = useMemo(() => toDate - 31 * 24 * 60 * 60 * 1000, []); // last 31 days

  const { data, loading } = useDayPoolFee(address, fromDate);

  if (loading || !data) {
    return <Loading />;
  }

  const feeData = data.poolTimeFees
    .map((d) => ({ ...d, date: new Date(d.timeframe) }));

  if (feeData.length <= 1) {
    return <span>Not enough data</span>;
  }

  const values = feeData.reduce((acc, { fee1, fee2 }) => [...acc, fee1, fee2], [] as number[]);
  const adjust = std(values);

  const f = scaleOrdinal(schemeCategory10)
    .domain(set(feeData.map((d) => d.timeframe)));

  const fill = (_d: Data, i: any): any => f(i);
  return (
    <DefaultChart
      data={feeData}
      fromDate={new Date(fromDate)}
      toDate={new Date(toDate)}
      type="svg"
    >
      <Chart id={1} yExtents={(d: Data) => [d.fee_1 + adjust, d.fee_2 + adjust, 0]}>
        <XAxis axisAt="bottom" orient="bottom" ticks={8} />
        <YAxis
          axisAt="left"
          orient="left"
          ticks={6}
          displayFormat={(d: Data) => d}
        />

        <MouseCoordinateX
          at="bottom"
          orient="bottom"
          displayFormat={timeFormat('%Y-%m-%d')}
        />

        <CurrentCoordinate yAccessor={(d: Data) => d.fee_1} fill={(d: Data) => d.fee_1} />
        <CurrentCoordinate yAccessor={(d: Data) => d.fee_2} fill={(d: Data) => d.fee_2} />

        <GroupedBarSeries
          yAccessor={[(d: Data) => d.fee_1, (d: Data) => d.fee_2]}
          fill={fill}
          spaceBetweenBar={3}
          width={20}
        />

        <SingleValueTooltip
          yLabel={symbol1}
          yAccessor={(d: Data) => d.fee_1}
          yDisplayFormat={(d: number) => `${formatAmount(d, decimal1)} ${symbol1}`}
          fontSize={21}
          origin={[20, 10]}
        />
        <SingleValueTooltip
          yLabel={symbol2}
          yAccessor={(d: Data) => d.fee_2}
          yDisplayFormat={(d: number) => `${formatAmount(d, decimal2)} ${symbol2}`}
          fontSize={21}
          origin={[20, 30]}
        />
        <SingleValueTooltip
          yLabel="Date"
          yAccessor={(d: Data) => d.date}
          fontSize={14}
          yDisplayFormat={timeFormat('%Y-%m-%d %H:%M:%S')}
          origin={[20, 50]}
        />
      </Chart>

      <CrossHairCursor />
    </DefaultChart>
  );
};

export default FeeChart;
