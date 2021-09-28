import React, { useEffect } from 'react';

const emptyDep: React.DependencyList = [];

export const useAsyncEffect = (
  fun: () => Promise<void>,
  dependencyList = emptyDep,
  cleanUp = () => {},
) => {
  useEffect(() => {
    fun();
    return () => {
      cleanUp();
    };
  }, [...dependencyList]);
};
