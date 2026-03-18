"use client";

import { useState, useEffect } from "react";

/**
 * Returns a debounced version of the given value that only updates after
 * the specified delay has elapsed without the value changing.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
