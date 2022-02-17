import { Observable, Subscription } from 'rxjs';
import { useEffect, useRef, useState } from 'react';

export const useObservableState = <T>(observable: Observable<T>): T | undefined => {
  const [value, setValue] = useState<T>();
  const subs = useRef<Subscription>();

  useEffect(() => {
    subs.current?.unsubscribe();
    subs.current = observable.subscribe((s) => {
      setValue(s);
    });
    return () => subs.current?.unsubscribe();
  }, [observable]);
  return value;
};
