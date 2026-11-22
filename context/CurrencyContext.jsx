'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrencyPrice, convertCurrencyAmount } from '@/lib/currencies';

const DEFAULT_BASE_CURRENCY = {
  code: 'INR',
  name: 'Indian Rupee',
  symbol: '₹',
  rate: 1,
  isBase: true,
  visible: true,
};

const CurrencyContext = createContext({
  currency: DEFAULT_BASE_CURRENCY,
  currencies: [DEFAULT_BASE_CURRENCY],
  setCurrency: () => {},
  formatPrice: (amount) => '',
  convertPrice: (amount) => 0,
  loading: false,
});

const STORAGE_KEY = 'mn_selected_currency';

export function CurrencyProvider({ children }) {
  const [currencies, setCurrencies] = useState([DEFAULT_BASE_CURRENCY]);
  const [selectedCode, setSelectedCode] = useState('INR');
  const [loading, setLoading] = useState(true);

  // 1. Initial read from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedCode(saved);
      }
    } catch {}
  }, []);

  // 2. Fetch active/visible currencies from our database API
  useEffect(() => {
    let mounted = true;
    async function loadCurrencies() {
      try {
        const res = await fetch('/api/currencies', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch currencies');
        const data = await res.json();
        if (mounted && Array.isArray(data.currencies) && data.currencies.length > 0) {
          setCurrencies(data.currencies);
        }
      } catch (err) {
        console.warn('Currency load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCurrencies();
    return () => {
      mounted = false;
    };
  }, []);

  // 3. Find current currency object or fallback to INR / first available
  const currentCurrency = useMemo(() => {
    const found = currencies.find(c => c.code === selectedCode);
    if (found) return found;
    const inr = currencies.find(c => c.code === 'INR');
    return inr || currencies[0] || DEFAULT_BASE_CURRENCY;
  }, [currencies, selectedCode]);

  // 4. Change currency callback
  const changeCurrency = useCallback((code) => {
    setSelectedCode(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  }, []);

  // 5. Formatting price callback
  const formatPrice = useCallback((amount) => {
    return formatCurrencyPrice(amount, currentCurrency);
  }, [currentCurrency]);

  // 6. Convert raw price number callback
  const convertPrice = useCallback((amount) => {
    return convertCurrencyAmount(amount, currentCurrency.rate);
  }, [currentCurrency]);

  const value = useMemo(() => ({
    currency: currentCurrency,
    currencies,
    setCurrency: changeCurrency,
    formatPrice,
    convertPrice,
    loading,
  }), [currentCurrency, currencies, changeCurrency, formatPrice, convertPrice, loading]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: DEFAULT_BASE_CURRENCY,
      currencies: [DEFAULT_BASE_CURRENCY],
      setCurrency: () => {},
      formatPrice: (amt) => (amt != null ? `₹${amt}` : ''),
      convertPrice: (amt) => Number(amt) || 0,
      loading: false,
    };
  }
  return ctx;
}
