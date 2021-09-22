import React, { useEffect } from 'react';

export const useAsyncEffect = (
  fun: () => Promise<void>,
  dependencyList: React.DependencyList,
  cleanUp = () => {}
) => {

  useEffect(() => {
    fun();
    return () => {
      cleanUp();
    };
  }, [...dependencyList])
}
