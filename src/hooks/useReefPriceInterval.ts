import { useEffect, useState } from 'react';
import { DataProgress, DataWithProgress } from '../utils/dataWithProgress';
import { reefPrice$ } from '../appState/tokenState';

export const useReefPriceInterval = (
): DataWithProgress<number> => {
  const [reefPrice, setReefPrice] = useState<DataWithProgress<number>>(
    DataProgress.LOADING,
  );
  useEffect(() => {
    const subs = reefPrice$.subscribe((price) => setReefPrice(price));
    return () => {
      subs.unsubscribe();
    };
  }, []);
  return reefPrice;
};