'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // ignore
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          typeof value === 'function'
            ? (value as (prev: T) => T)(storedValue)
            : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch {
        // ignore
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
