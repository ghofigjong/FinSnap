import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAISettings } from '../lib/aiSettings';

interface CurrencyContextType {
  currency: string;
  refresh: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  refresh: async () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState('USD');

  const refresh = useCallback(async () => {
    const settings = await getAISettings();
    setCurrency(settings.currency || 'USD');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CurrencyContext.Provider value={{ currency, refresh }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
