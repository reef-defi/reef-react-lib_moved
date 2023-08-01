import { useEffect, useState } from 'react';
import { DataProgress, DataWithProgress } from '../utils/dataWithProgress';
//TODO update reefprice func in util-lib anukulpandey
import { reefPrice$ } from '@reef-chain/util-lib/lib/token/reefPrice';
import { map, skipWhile } from 'rxjs';
import { FeedbackStatusCode } from '@reef-chain/util-lib/lib/reefState';

export const useReefPriceInterval = (
): DataWithProgress<number> => {
  const [reefPrice, setReefPrice] = useState<DataWithProgress<number>>(
    DataProgress.LOADING,
  );
  useEffect(() => {
    const subs = reefPrice$.pipe(
      skipWhile(
        value =>
          !value.hasStatus(FeedbackStatusCode.COMPLETE_DATA) 
      ),map(value=>value.data)
    ).subscribe(value=>setReefPrice(value));
    return () => {
      subs.unsubscribe();
    };
  }, []);
  return reefPrice;
};
