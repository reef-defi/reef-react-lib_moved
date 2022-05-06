import React from 'react';
import { scaleTime } from 'd3-scale';
// @ts-ignore
import { ChartCanvas } from 'react-stockcharts';
// @ts-ignore
import { fitWidth } from 'react-stockcharts/lib/helper';
import { CHART_HEIGHT, CHART_MARGIN, DefaultChartType } from './types';
import './Chart.css';

const DefaultChart: React.FC<DefaultChartType> = ({
  ratio, width, data, type, fromDate, toDate, children,
}): JSX.Element => (
  <ChartCanvas
    ratio={ratio}
    width={width}
    height={CHART_HEIGHT}
    margin={CHART_MARGIN}
    type={type}
    pointsPerPxThreshold={1}
    seriesName="MSFT"
    data={data}
    displayXAccessor={(d: any) => d.date}
    xAccessor={(d: any) => d.date}
    xScale={scaleTime()}
    xExtents={[fromDate, toDate]}
    mouseMoveEvent
    panEvent={false}
    zoomEvent={false}
    clamp={false}
  >
    {children}
  </ChartCanvas>
);

export default fitWidth(DefaultChart);
