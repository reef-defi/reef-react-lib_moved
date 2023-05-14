export interface Settings {
  gasLimit: string;
  percentage: number;
  deadline: number;
}

export const DEFAULT_SLIPPAGE_TOLERANCE = 0.8;
export const MAX_SLIPPAGE_TOLERANCE = 0.5;
export const DEFAULT_DEADLINE = 1;
export const DEFAULT_GAS_LIMIT = '0.000003';
export const REMOVE_DEFAULT_SLIPPAGE_TOLERANCE = 5;

export const defaultSettings = (): Settings => ({
  gasLimit: DEFAULT_GAS_LIMIT,
  deadline: Number.NaN,
  percentage: Number.NaN,
});

export const resolveSettings = (
  { deadline, gasLimit, percentage }: Settings,
  defaultPercentage = DEFAULT_SLIPPAGE_TOLERANCE,
): Settings => ({
  deadline: Number.isNaN(deadline) ? DEFAULT_DEADLINE : deadline,
  gasLimit: gasLimit === '' ? DEFAULT_GAS_LIMIT : gasLimit,
  percentage: Number.isNaN(percentage) ? defaultPercentage : percentage,
});

export const toGasLimitObj = (gasLimit: string): { gasLimit: string } => ({
  gasLimit,
});
