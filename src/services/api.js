import axios from 'axios';

const DEFAULT_API_BASE_URL = 'http://localhost:3001';
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/$/,
  ''
);
const LOCAL_STORAGE_KEYS = {
  portfolio: 'cryptoTracker_portfolio',
  alerts: 'cryptoTracker_alerts',
  users: 'cryptoTracker_users',
};

// Deterministic mock data so the app still works when external APIs are blocked (offline / rate limits).
const mockMarketData = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 67123.56,
    price_change_percentage_24h: 1.92,
    market_cap: 1321432987654,
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 3145.78,
    price_change_percentage_24h: -0.85,
    market_cap: 377654321987,
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png',
    current_price: 458.12,
    price_change_percentage_24h: 0.45,
    market_cap: 67543219876,
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 152.34,
    price_change_percentage_24h: 3.12,
    market_cap: 67892301987,
  },
  {
    id: 'ripple',
    symbol: 'xrp',
    name: 'XRP',
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    current_price: 0.74,
    price_change_percentage_24h: -2.45,
    market_cap: 41234567890,
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    current_price: 0.56,
    price_change_percentage_24h: 0.87,
    market_cap: 19654329876,
  },
  {
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    current_price: 0.18,
    price_change_percentage_24h: 4.23,
    market_cap: 24321987654,
  },
  {
    id: 'tron',
    symbol: 'trx',
    name: 'TRON',
    image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
    current_price: 0.13,
    price_change_percentage_24h: -1.44,
    market_cap: 11329876543,
  },
  {
    id: 'polkadot',
    symbol: 'dot',
    name: 'Polkadot',
    image: 'https://assets.coingecko.com/coins/images/12171/large/aJGBjJFU_400x400.jpg',
    current_price: 9.72,
    price_change_percentage_24h: 2.11,
    market_cap: 12234567890,
  },
  {
    id: 'avalanche-2',
    symbol: 'avax',
    name: 'Avalanche',
    image: 'https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png',
    current_price: 41.23,
    price_change_percentage_24h: 1.67,
    market_cap: 15234567890,
  },
];

const mockCoinDetails = mockMarketData.reduce((acc, coin) => {
  acc[coin.id] = {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    market_data: {
      current_price: {
        usd: coin.current_price,
      },
    },
    image: {
      large: coin.image,
    },
  };
  return acc;
}, {});

// Track whether we should bypass HTTP calls altogether (e.g. server not running or deployed build)
let useLocalFallback = false;
const hasBrowserStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isNetworkError = (error) => {
  if (!error) return true;
  if (error?.response) return false;
  const message = (error.message || '').toLowerCase();
  return (
    error.code === 'ERR_NETWORK' ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('load failed')
  );
};

const readLocalData = (resource) => {
  if (!hasBrowserStorage) return [];
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEYS[resource]);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn(`Unable to parse local ${resource} data`, error);
    return [];
  }
};

const writeLocalData = (resource, data) => {
  if (!hasBrowserStorage) return;
  window.localStorage.setItem(LOCAL_STORAGE_KEYS[resource], JSON.stringify(data));
};

const generateLocalId = () => Date.now() + Math.floor(Math.random() * 1_000);

const withFallback = async (resource, action, requestFn, fallbackFn) => {
  if (!useLocalFallback) {
    try {
      return await requestFn();
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn(
          `[${resource}] Falling back to localStorage for ${action} due to network error.`,
          error
        );
        useLocalFallback = true;
      } else {
        throw error;
      }
    }
  }

  const fallbackResult = await fallbackFn();
  return { data: fallbackResult };
};

// Helper to get current user ID from localStorage
const getCurrentUserId = () => {
  if (!hasBrowserStorage) return null;
  try {
    const userStr = localStorage.getItem('cryptoTracker_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || null;
    }
  } catch (error) {
    console.warn('Error getting current user:', error);
  }
  return null;
};

const createLocalResourceAPI = (resource, filterByUserId = false) => ({
  getAll: () =>
    withFallback(
      resource,
      'getAll',
      async () => {
        const response = await api.get(`/${resource}`);
        let data = response.data;
        // Filter by userId if needed
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (userId) {
            data = data.filter((item) => item.userId === userId);
          } else {
            data = [];
          }
        }
        return { data };
      },
      () => {
        let data = readLocalData(resource);
        // Filter by userId if needed
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (userId) {
            data = data.filter((item) => item.userId === userId);
          } else {
            data = [];
          }
        }
        return data;
      }
    ),
  getById: (id) =>
    withFallback(
      resource,
      'getById',
      () => api.get(`/${resource}/${id}`),
      () => {
        const data = readLocalData(resource);
        const item = data.find((item) => `${item.id}` === `${id}`) || null;
        // Check userId if filtering is enabled
        if (filterByUserId && item) {
          const userId = getCurrentUserId();
          if (userId && item.userId !== userId) {
            return null;
          }
        }
        return item;
      }
    ),
  create: (payload) =>
    withFallback(
      resource,
      'create',
      async () => {
        let finalPayload = { ...payload };
        // Add userId if filtering is enabled
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (!userId) {
            throw new Error('User not authenticated');
          }
          finalPayload = { ...finalPayload, userId };
        }
        return await api.post(`/${resource}`, finalPayload);
      },
      () => {
        const data = readLocalData(resource);
        let finalPayload = { ...payload };
        // Add userId if filtering is enabled
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (!userId) {
            throw new Error('User not authenticated');
          }
          finalPayload = { ...finalPayload, userId };
        }
        const newItem = { ...finalPayload, id: finalPayload?.id ?? generateLocalId() };
        writeLocalData(resource, [...data, newItem]);
        return newItem;
      }
    ),
  update: (id, payload) =>
    withFallback(
      resource,
      'update',
      async () => {
        let finalPayload = { ...payload };
        // Ensure userId is preserved if filtering is enabled
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (!userId) {
            throw new Error('User not authenticated');
          }
          // Don't override userId if it's already set
          if (!finalPayload.userId) {
            finalPayload = { ...finalPayload, userId };
          }
        }
        return await api.put(`/${resource}/${id}`, finalPayload);
      },
      () => {
        const data = readLocalData(resource);
        const item = data.find((item) => `${item.id}` === `${id}`);
        if (!item) return null;
        
        let finalPayload = { ...payload };
        // Check userId if filtering is enabled
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (!userId || item.userId !== userId) {
            throw new Error('Unauthorized');
          }
          // Preserve userId
          if (!finalPayload.userId) {
            finalPayload = { ...finalPayload, userId };
          }
        }
        
        const updatedData = data.map((item) =>
          `${item.id}` === `${id}` ? { ...item, ...finalPayload, id: item.id } : item
        );
        writeLocalData(resource, updatedData);
        return updatedData.find((item) => `${item.id}` === `${id}`) || null;
      }
    ),
  delete: (id) =>
    withFallback(
      resource,
      'delete',
      () => api.delete(`/${resource}/${id}`),
      () => {
        const data = readLocalData(resource);
        const item = data.find((item) => `${item.id}` === `${id}`);
        
        // Check userId if filtering is enabled
        if (filterByUserId && item) {
          const userId = getCurrentUserId();
          if (!userId || item.userId !== userId) {
            throw new Error('Unauthorized');
          }
        }
        
        const filtered = data.filter((item) => `${item.id}` !== `${id}`);
        writeLocalData(resource, filtered);
        return true;
      }
    ),
});

// Portfolio API (user-specific)
export const portfolioAPI = createLocalResourceAPI('portfolio', true);

// Alerts API (user-specific)
export const alertsAPI = createLocalResourceAPI('alerts', true);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.get('/users');
      const users = response.data;
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      
      if (user) {
        // Don't return password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      // Fallback to localStorage
      const localUsers = readLocalData('users');
      const localUser = localUsers.find(
        (u) => u.email === email && u.password === password
      );
      
      if (localUser) {
        const { password: _, ...userWithoutPassword } = localUser;
        return userWithoutPassword;
      }
      
      return null;
    } catch (error) {
      if (isNetworkError(error)) {
        // Fallback to localStorage
        const localUsers = readLocalData('users');
        const localUser = localUsers.find(
          (u) => u.email === email && u.password === password
        );
        
        if (localUser) {
          const { password: _, ...userWithoutPassword } = localUser;
          return userWithoutPassword;
        }
      }
      throw error;
    }
  },
  
  signup: async (name, email, password) => {
    try {
      // Check if user exists
      const response = await api.get('/users');
      const users = response.data;
      const existingUser = users.find((u) => u.email === email);
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser = {
        name,
        email,
        password, // In production, this should be hashed
        id: Date.now() + Math.floor(Math.random() * 1_000),
      };
      
      await api.post('/users', newUser);
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      if (isNetworkError(error)) {
        // Fallback to localStorage
        const localUsers = readLocalData('users');
        const existingUser = localUsers.find((u) => u.email === email);
        
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
        
        const newUser = {
          name,
          email,
          password, // In production, this should be hashed
          id: Date.now() + Math.floor(Math.random() * 1_000),
        };
        
        writeLocalData('users', [...localUsers, newUser]);
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
      }
      throw error;
    }
  },
};

// Crypto Market Data API (using CoinGecko free API)
let useMockMarketData = false;
let useMockCoinDetails = false;

const paginateMockData = (page, perPage) => {
  const start = (page - 1) * perPage;
  const slice = mockMarketData.slice(start, start + perPage);
  return slice.length > 0 ? slice : mockMarketData;
};

export const cryptoAPI = {
  getMarketData: async (page = 1, perPage = 50) => {
    if (useMockMarketData) {
      return paginateMockData(page, perPage);
    }

    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`
      );
      return response.data;
    } catch (error) {
      console.warn('Error fetching real crypto data, using fallback dataset.', error);
      useMockMarketData = true;
      return paginateMockData(page, perPage);
    }
  },
  getCoinDetails: async (coinId) => {
    if (useMockCoinDetails) {
      return mockCoinDetails[coinId] || null;
    }

    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);
      return response.data;
    } catch (error) {
      console.warn(`Error fetching coin details for ${coinId}, using fallback data.`, error);
      useMockCoinDetails = true;
      return mockCoinDetails[coinId] || null;
    }
  },
  getNews: async () => {
    try {
      // Using CryptoCompare API for news (free tier)
      const response = await axios.get(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN'
      );
      return response.data.Data || [];
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data if API fails
      return [];
    }
  },
};

export default api;

