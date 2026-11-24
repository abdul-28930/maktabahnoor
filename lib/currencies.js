// Currency configuration, ExchangeRate-API integration, and formatting helpers.

export const BASE_CURRENCY = 'INR';

export const KNOWN_SYMBOLS = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SAR: 'SAR', CAD: 'CA$', AUD: 'AU$',
  SGD: 'SG$', QAR: 'QAR', KWD: 'KWD', OMR: 'OMR', BHD: 'BHD', MYR: 'RM', IDR: 'Rp',
  TRY: '₺', JPY: '¥', CHF: 'CHF', CNY: '¥', CNH: '¥', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  NZD: 'NZ$', ZAR: 'R', BRL: 'R$', PHP: '₱', KRW: '₩', PLN: 'zł', THB: '฿', MXN: 'MX$',
  CZK: 'Kč', ILS: '₪', HUF: 'Ft', RON: 'lei', BGN: 'лв', ISK: 'kr', HKD: 'HK$',
  PKR: 'Rs', BDT: '৳', EGP: 'E£', NGN: '₦', RUB: '₽', KES: 'KSh', GHS: 'GH₵',
  VND: '₫', UAH: '₴', TWD: 'NT$', LKR: 'Rs', NPR: 'Rs', IQD: 'IQD', JOD: 'JOD',
  MAD: 'MAD', DZD: 'DZD', TND: 'TND', COP: 'COL$', CLP: 'CLP$', ARS: 'AR$', PEN: 'S/',
};

// All 166 currency codes supported by ExchangeRate-API
export const ALL_CURRENCY_CODES = [
  'INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'SGD', 'QAR',
  'KWD', 'OMR', 'BHD', 'MYR', 'IDR', 'TRY', 'JPY', 'CHF', 'CNY', 'CNH',
  'SEK', 'NOK', 'DKK', 'NZD', 'ZAR', 'BRL', 'PHP', 'KRW', 'PLN', 'THB',
  'MXN', 'CZK', 'ILS', 'HUF', 'RON', 'BGN', 'ISK', 'HKD', 'PKR', 'BDT',
  'EGP', 'NGN', 'RUB', 'KES', 'GHS', 'VND', 'UAH', 'TWD', 'LKR', 'NPR',
  'IQD', 'JOD', 'MAD', 'DZD', 'TND', 'COP', 'CLP', 'ARS', 'PEN', 'AFN',
  'ALL', 'AMD', 'ANG', 'AOA', 'AWG', 'AZN', 'BAM', 'BBD', 'BIF', 'BMD',
  'BND', 'BOB', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CDF', 'CLF', 'CRC',
  'CUP', 'CVE', 'DJF', 'DOP', 'ERN', 'ETB', 'FJD', 'FKP', 'FOK', 'GEL',
  'GGP', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HNL', 'HRK', 'HTG', 'IMP',
  'IRR', 'JEP', 'JMD', 'KGS', 'KHR', 'KID', 'KMF', 'KYD', 'KZT', 'LAK',
  'LBP', 'LRD', 'LSL', 'LYD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP',
  'MRU', 'MUR', 'MVR', 'MWK', 'MZN', 'NAD', 'NIO', 'PAB', 'PGK', 'PYG',
  'RSD', 'RWF', 'SBD', 'SCR', 'SDG', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD',
  'SSP', 'STN', 'SYP', 'SZL', 'TJS', 'TMT', 'TOP', 'TTD', 'TVD', 'TZS',
  'UGX', 'UYU', 'UZS', 'VES', 'VUV', 'WST', 'XAF', 'XCD', 'XCG', 'XDR',
  'XOF', 'XPF', 'YER', 'ZMW', 'ZWG', 'ZWL'
];

let cachedDisplayNames = null;
function getDisplayNames() {
  if (!cachedDisplayNames && typeof Intl !== 'undefined' && Intl.DisplayNames) {
    try {
      cachedDisplayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
    } catch {
      cachedDisplayNames = null;
    }
  }
  return cachedDisplayNames;
}

export function getCurrencyName(code) {
  if (!code) return '';
  const dn = getDisplayNames();
  if (dn) {
    try {
      const name = dn.of(code);
      if (name) return name;
    } catch {}
  }
  return code;
}

export function getCurrencySymbol(code) {
  if (!code) return '';
  if (KNOWN_SYMBOLS[code]) return KNOWN_SYMBOLS[code];
  if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
    try {
      const parts = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
      }).formatToParts(1);
      const sym = parts.find(p => p.type === 'currency');
      if (sym && sym.value) return sym.value;
    } catch {}
  }
  return code;
}

// Backward-compatible metadata map for the top 37 currencies
export const CURRENCY_METADATA = ALL_CURRENCY_CODES.reduce((acc, code) => {
  acc[code] = {
    code,
    name: getCurrencyName(code),
    symbol: getCurrencySymbol(code),
    isBase: code === 'INR',
  };
  return acc;
}, {});

/**
 * Default seed list: all currencies set to visible: false ("Hide" by default)
 * except base currency INR.
 */
export function buildDefaultCurrencies(rates = {}) {
  const codes = Array.from(new Set([...ALL_CURRENCY_CODES, ...Object.keys(rates)]));
  return codes.map(code => {
    let rate = 1;
    if (code === 'INR') {
      rate = 1;
    } else if (rates[code] !== undefined && !isNaN(Number(rates[code]))) {
      rate = Number(rates[code]);
    }

    return {
      code,
      name: getCurrencyName(code),
      symbol: getCurrencySymbol(code),
      rate: Number(rate),
      visible: code === 'INR', // all foreign currencies are "Hide" by default
      isBase: code === 'INR',
      updatedAt: null,
    };
  });
}

/**
 * Fetch latest exchange rates with base INR from ExchangeRate-API (https://open.er-api.com/v6/latest/INR)
 * Fallback: Frankfurter API (https://api.frankfurter.app/latest?from=INR)
 */
export async function fetchExchangeRates() {
  // 1. Primary: ExchangeRate-API (supports 166 world currencies)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result === 'success' && data.rates && typeof data.rates === 'object') {
        const rates = { ...data.rates, INR: 1 };
        const date = data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        return {
          provider: 'ExchangeRate-API',
          date,
          rates,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from ExchangeRate-API, trying fallback:', err?.message);
  }

  // 2. Fallback: Frankfurter API
  const fallbackUrls = [
    'https://api.frankfurter.app/latest?from=INR',
    'https://api.frankfurter.dev/v1/latest?from=INR',
  ];

  for (const url of fallbackUrls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && typeof data.rates === 'object') {
          const rates = { ...data.rates, INR: 1 };
          return {
            provider: 'Frankfurter',
            date: data.date || new Date().toISOString().slice(0, 10),
            rates,
          };
        }
      }
    } catch (err) {
      console.warn(`Failed fallback from ${url}:`, err?.message);
    }
  }

  throw new Error('Could not fetch exchange rates from ExchangeRate-API or fallback API.');
}

// Alias for backwards compatibility
export const fetchFrankfurterRates = fetchExchangeRates;

const NO_SPACE_SYMBOLS = new Set(['$', '€', '£', '₹', '¥']);

/**
 * Format a price from INR into target currency with symbol and exact 2 decimal places.
 * Example: 100 INR -> $1.08 USD, AR$ 1,696.60, ֏ 388.28, Kz 1,018.67
 */
export function formatCurrencyPrice(amount, curr) {
  if (amount == null || amount === '' || isNaN(Number(amount))) return '';
  const num = Number(amount);
  const code = curr?.code || 'INR';
  const symbol = curr?.symbol || (code === 'INR' ? '₹' : '$');
  const rate = typeof curr?.rate === 'number' && curr.rate > 0 ? curr.rate : 1;
  const converted = num * rate;

  if (code === 'INR') {
    return Number.isInteger(converted)
      ? `${symbol}${converted.toLocaleString('en-IN')}`
      : `${symbol}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Exact 2 decimals for all foreign currencies as requested
  const formattedNum = converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const needsSpace = !NO_SPACE_SYMBOLS.has(symbol) || symbol.length > 1;
  return needsSpace ? `${symbol} ${formattedNum}` : `${symbol}${formattedNum}`;
}

export function convertCurrencyAmount(amount, rate = 1) {
  if (amount == null || amount === '' || isNaN(Number(amount))) return 0;
  return Number((Number(amount) * rate).toFixed(2));
}
