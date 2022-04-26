import { DependencyList, useEffect, useState } from 'react';

type Loader<Type> = {
  error: string;
  loading: boolean;
  value: Type;
};

// Hard loader ensures value always exists
export const useLoader = <LoaderType, LoaderArgs extends any[]>(
  fun: (...args: LoaderArgs) => Promise<LoaderType>,
  args: LoaderArgs,
  initialState: LoaderType,
  deps?: DependencyList,
): Loader<LoaderType> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [value, setValue] = useState(initialState);

  useEffect(
    () => {
      const loader = async (): Promise<void> => {
        try {
          setLoading(true);
          const value = await fun(...args);
          setValue(value);
        } catch (e) {
          console.error(e);
          setError(e.message);
        }
      };

      loader();
    },
    deps,
  );

  return { error, loading, value };
};

// Soft loader by default has optional value as an output
export const useSoftLoader = <LoaderType, LoaderArgs extends any[]>(
  fun: (...args: LoaderArgs) => Promise<LoaderType>,
  args: LoaderArgs,
  initialState?: LoaderType,
  deps?: DependencyList,
): Loader<LoaderType | undefined> => useLoader<LoaderType | undefined, LoaderArgs>(
  fun,
  args,
  initialState,
  deps,
);
