import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const colorScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return 'light';
  }

  return colorScheme === 'dark' ? 'dark' : 'light';
}