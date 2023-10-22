// import { useMemo } from 'react';
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

export const truncateDate = (date: Date, timeUnit: TimeUnit, up = false) => {
  date.setUTCSeconds(0, 0);

  switch (timeUnit) {
    case 'Minute':
      if (up && date.getUTCSeconds() !== 0) date.setUTCSeconds(60);
      break;
    case 'Hour':
      if (up && date.getUTCMinutes() !== 0) date.setUTCMinutes(60);
      else date.setUTCMinutes(0);
      break;
    case 'Day':
      if (up && date.getUTCHours() !== 0) date.setUTCHours(24, 0);
      else date.setUTCHours(0, 0);
      break;
  }

  return date;
};

// export const useFromTime = (timeUnit: TimeUnit, timeSpan: number) => useMemo(
//   () => {
//     const toTime = new Date();
//     const fromTime = new Date(toTime.getTime() - timeDataToMs({timeUnit, timeSpan}));
//     const fromTimeTruncated = truncateDate(fromTime, timeUnit);
//     return { fromTime: fromTimeTruncated, toTime };
//   },
//   [timeUnit, timeSpan],
// );

export const calcTimeRange = (timeUnit: TimeUnit, timeSpan: number) => {
  const toTime = truncateDate(new Date(), timeUnit, true);
  const fromTime = new Date(toTime.getTime() - timeDataToMs({ timeUnit, timeSpan }));

  return { fromTime, toTime };
};