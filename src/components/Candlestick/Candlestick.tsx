import React, { useState } from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart, ZoomButtons } from "react-stockcharts";
import {
	BarSeries,
	CandlestickSeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
	CrossHairCursor,
	MouseCoordinateX,
	MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
	OHLCTooltip,
} from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";

interface Candlestick {

}

const data = [
  {open: 1.1, low: 0.9, high: 1.4, close: 1.2},
  {open: 1, low: 0.7, high: 1.5, close: 1.2},
  {open: 0.9, low: 0.5, high: 1.6, close: 1.1},
  {open: 0.8, low: 0.4, high: 1.4, close: 1.3},
  {open: 0.7, low: 0.2, high: 1.5, close: 1.5},
  {open: 0.9, low: 0.5, high: 1.4, close: 1.3},
]

// const CandlestickGraph = ({} : Candlestick): JSX.Element => {
//   return (
//     <div>

//     </div>
//   );
// }

// export default CandlestickGraph;

interface Data {
  high: number;
  low: number;
  open: number;
  close: number;
  timestmap: number;
}
interface CandleStickChartWithZoomPanProps {
  data: Data[]
  width: number;
  ratio: string;
  type?: "svg" | "hybrid";
	mouseMoveEvent?: boolean,
	panEvent?: boolean,
	zoomEvent?: boolean,
	clamp?: boolean,
}

const CandleStickChartWithZoomPanStart = ({data: initialData, width, ratio, type="svg", mouseMoveEvent=true, panEvent=true, zoomEvent=true, clamp=false}: CandleStickChartWithZoomPanProps): JSX.Element => {

  const [state, setState] = useState({
    suffix: 1
  });
  const handleReset = () => setState({suffix: state.suffix + 1})
  const xScaleProvider = discontinuousTimeScaleProvider
    .inputDateAccessor(d => d.date);
  const {
    data,
    xScale,
    xAccessor,
    displayXAccessor,
  } = xScaleProvider(initialData);

  const start = xAccessor(last(data));
  const end = xAccessor(data[Math.max(0, data.length - 150)]);
  const xExtents = [start, end];

  const margin = { left: 70, right: 70, top: 20, bottom: 30 };

  const height = 400;

  const gridHeight = height - margin.top - margin.bottom;
  const gridWidth = width - margin.left - margin.right;

  const showGrid = true;
  const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
  const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};

  return (
    <ChartCanvas height={height}
      ratio={ratio}
      width={width}
      margin={{ left: 70, right: 70, top: 10, bottom: 30 }}

      mouseMoveEvent={mouseMoveEvent}
      panEvent={panEvent}
      zoomEvent={zoomEvent}
      clamp={clamp}
      type={type}
      seriesName={`MSFT_${state.suffix}`}
      data={data}
      xScale={xScale}
      xExtents={xExtents}
      xAccessor={xAccessor}
      displayXAccessor={displayXAccessor}
    >

      <Chart id={1}
        yExtents={d => [d.high, d.low]}
      >
        <XAxis axisAt="bottom"
          orient="bottom"
          zoomEnabled={zoomEvent}
          {...xGrid} />
        <YAxis axisAt="right"
          orient="right"
          ticks={5}
          zoomEnabled={zoomEvent}
          {...yGrid}
        />

        <MouseCoordinateY
          at="right"
          orient="right"
          displayFormat={format(".2f")} />

        <CandlestickSeries />
        <OHLCTooltip origin={[-40, 0]}/>
        <ZoomButtons
          onReset={handleReset}
        />
      </Chart>
      <Chart id={2}
        yExtents={d => d.volume}
        height={150} origin={(w, h) => [0, h - 150]}
      >
        <YAxis
          axisAt="left"
          orient="left"
          ticks={5}
          tickFormat={format(".2s")}
          zoomEnabled={zoomEvent}
        />

        <MouseCoordinateX
          at="bottom"
          orient="bottom"
          displayFormat={timeFormat("%Y-%m-%d")} />
        <MouseCoordinateY
          at="left"
          orient="left"
          displayFormat={format(".4s")} />

        <BarSeries yAccessor={d => d.volume} fill={(d) => d.close > d.open ? "#6BA583" : "#FF0000"} />
      </Chart>
      <CrossHairCursor />
    </ChartCanvas>
  );
}


// class CandleStickChartWithZoomPan extends React.Component {
// 	constructor(props) {
// 		super(props);
// 		this.saveNode = this.saveNode.bind(this);
// 		this.resetYDomain = this.resetYDomain.bind(this);
// 		this.handleReset = this.handleReset.bind(this);
// 	}
// 	componentWillMount() {
// 		this.setState({
// 			suffix: 1
// 		});
// 	}
// 	saveNode(node) {
// 		this.node = node;
// 	}
// 	resetYDomain() {
// 		this.node.resetYDomain();
// 	}
// 	handleReset() {
// 		this.setState({
// 			suffix: this.state.suffix + 1
// 		});
// 	}
// 	render() {
// 		const { type, width, ratio } = this.props;
// 		const { mouseMoveEvent, panEvent, zoomEvent, zoomAnchor } = this.props;
// 		const { clamp } = this.props;

// 		const { data: initialData } = this.props;

// 		const xScaleProvider = discontinuousTimeScaleProvider
// 			.inputDateAccessor(d => d.date);
// 		const {
// 			data,
// 			xScale,
// 			xAccessor,
// 			displayXAccessor,
// 		} = xScaleProvider(initialData);

// 		const start = xAccessor(last(data));
// 		const end = xAccessor(data[Math.max(0, data.length - 150)]);
// 		const xExtents = [start, end];

// 		const margin = { left: 70, right: 70, top: 20, bottom: 30 };

// 		const height = 400;

// 		const gridHeight = height - margin.top - margin.bottom;
// 		const gridWidth = width - margin.left - margin.right;

// 		const showGrid = true;
// 		const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
// 		const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};

// 	}
// }

// }
// CandleStickChartWithZoomPan.propTypes = {
// 	data: PropTypes.array.isRequired,
// 	width: PropTypes.number.isRequired,
// 	ratio: PropTypes.number.isRequired,
// 	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
// };

// CandleStickChartWithZoomPan.defaultProps = {
// 	type: "svg",
// 	mouseMoveEvent: true,
// 	panEvent: true,
// 	zoomEvent: true,
// 	clamp: false,
// };

export default fitWidth(CandleStickChartWithZoomPanStart);


