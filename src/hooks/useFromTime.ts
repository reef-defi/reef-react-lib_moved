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
    const toTime = new Date();
    const fromTime = new Date(toTime.getTime() - timeDataToMs({timeUnit, timeSpan}));
    fromTime.setUTCSeconds(0, 0);
    if (timeUnit === 'Hour') {
      fromTime.setUTCMinutes(0);
    } else if (timeUnit === 'Day') {
      fromTime.setUTCHours(0, 0);
    }
    return { fromTime, toTime };
  },
  [timeUnit, timeSpan],
);
