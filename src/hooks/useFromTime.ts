import { useMemo } from 'react';
import { TimeData, TimeUnit } from './usePoolData';

export const timeDataToMs = (timeData: TimeData): number => {
  const { timeSpan, timeUnit } = timeData;
  switch (timeUnit) {
    case 'Day':
      return timeSpan * 24 * 60 * 60 * 1000;
    case 'Hour':
      return timeSpan * 60 * 60 * 1000;
    case 'Minute':
      return timeSpan * 60 * 1000;
    default:
      return 0;
  }
};

export const useFromTime = (timeUnit: TimeUnit, timeSpan: number) => useMemo(
  () => {
    const now = new Date();
    now.setSeconds(0, 0);
    if (timeUnit === 'Hour') {
      now.setMinutes(0);
    } else if (timeUnit === 'Day') {
      now.setHours(0);
      now.setMinutes(0);
    }
    const fromTime = new Date(now.getTime() - timeDataToMs({timeUnit, timeSpan}));
    return { now, fromTime };
  },
  [timeUnit, timeSpan],
);
