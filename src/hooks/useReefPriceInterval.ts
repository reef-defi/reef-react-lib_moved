import { useEffect, useState } from 'react';
import { DataProgress, DataWithProgress } from '../utils/dataWithProgress';
import { retrieveReefCoingeckoPrice } from '../api/prices';

export const useReefPriceInterval = (
  intervalMs: number,
): DataWithProgress<number> => {
  const [reefPrice, setReefPrice] = useState<DataWithProgress<number>>(
    DataProgress.LOADING,
  );
  useEffect(() => {
    const getPrice = async (): Promise<void> => {
      let price: number | DataProgress = DataProgress.NO_DATA;
      try {
        price = await retrieveReefCoingeckoPrice();
      } catch (e) {}
      setReefPrice(price);
    };
    const interval = setInterval(getPrice, intervalMs);
    getPrice();
    return () => {
      clearInterval(interval);
    };
  }, []);
  return reefPrice;
};
