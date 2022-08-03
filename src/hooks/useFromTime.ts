import { useMemo } from "react";

export const useFromTime = (days: number) => useMemo(
  () => Date.now() - days * 24 * 60 * 60 * 1000,
  []
)
