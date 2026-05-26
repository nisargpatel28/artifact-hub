'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredApiKey, storeApiKey } from '@/lib/api';

interface ApiKeyContextValue {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue>({ apiKey: '', setApiKey: () => {} });

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState('');

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setApiKeyState(getStoredApiKey());
  }, []);

  function setApiKey(key: string) {
    const trimmed = key.trim();
    setApiKeyState(trimmed);
    storeApiKey(trimmed);
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  return useContext(ApiKeyContext);
}
