export const CHART_HEIGHT = 565;
export const CHART_MARGIN = {
  left: 60, right: 40, top: 10, bottom: 30,
};

export interface DefaultChartType {
  width: number;
  ratio: number;
  fromDate: Date;
  toDate: Date;
  type?: 'svg' | 'hybrid';
  data: any[];
}
