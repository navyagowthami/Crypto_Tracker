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
  cryptoList: 'cryptoTracker_cryptoList',
  cryptoListTimestamp: 'cryptoTracker_cryptoListTimestamp',
};

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

let useLocalFallback = false;
const hasBrowserStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

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
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (!userId) {
            throw new Error('User not authenticated');
          }
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
        if (filterByUserId) {
          const userId = getCurrentUserId();
          if (!userId || item.userId !== userId) {
            throw new Error('Unauthorized');
          }
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

export const portfolioAPI = createLocalResourceAPI('portfolio', true);

export const alertsAPI = createLocalResourceAPI('alerts', true);

export const authAPI = {
  login: async (email, password) => {
    const localUsers = readLocalData('users');
    const localUser = localUsers.find(
      (u) => u.email === email && u.password === password
    );
    
    if (localUser) {
      const { password: _, ...userWithoutPassword } = localUser;
      return userWithoutPassword;
    }
    
    try {
      const response = await api.get('/users');
      const users = response.data;
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      
      if (user) {
        const existingIndex = localUsers.findIndex((u) => u.id === user.id);
        if (existingIndex >= 0) {
          localUsers[existingIndex] = user;
        } else {
          localUsers.push(user);
        }
        writeLocalData('users', localUsers);
        
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    } catch (error) {
      console.warn('API not available, using localStorage only:', error);
    }
    
    return null;
  },
  
  signup: async (name, email, password) => {
    const localUsers = readLocalData('users');
    const existingUser = localUsers.find((u) => u.email === email);
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const newUser = {
      name,
      email,
      password, 
      id: Date.now() + Math.floor(Math.random() * 1_000),
    };
    
    writeLocalData('users', [...localUsers, newUser]);
    
    try {
      await api.post('/users', newUser);
    } catch (error) {
      console.warn('API not available, saved to localStorage only:', error);
    }
    
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
};

let useMockMarketData = false;
let useMockCoinDetails = false;

const paginateMockData = (page, perPage) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const slice = mockMarketData.slice(start, end);
  
  if (slice.length === 0) {
    return [];
  }
  
  return slice;
};

const CRYPTO_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getCachedCryptoList = () => {
  if (!hasBrowserStorage) return null;
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.cryptoList);
    const timestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.cryptoListTimestamp);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CRYPTO_LIST_CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.warn('Error reading cached crypto list:', error);
  }
  return null;
};

const setCachedCryptoList = (list) => {
  if (!hasBrowserStorage) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.cryptoList, JSON.stringify(list));
    localStorage.setItem(LOCAL_STORAGE_KEYS.cryptoListTimestamp, Date.now().toString());
  } catch (error) {
    console.warn('Error caching crypto list:', error);
  }
};

const fetchAllCryptocurrencies = async () => {
  const cached = getCachedCryptoList();
  if (cached && cached.length > 0) {
    console.log(`Using cached crypto list with ${cached.length} items`);
    return cached;
  }

  console.log('Fetching fresh cryptocurrency list from API...');
  const allCryptos = [];
  let page = 1;
  const perPage = 250; 
  const maxPages = 4; 
  try {
    while (page <= maxPages) {
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`,
          { timeout: 10000 } 
        );
        
        if (!response.data || response.data.length === 0) {
          break; 
        }
        
        allCryptos.push(...response.data);
        
        if (response.data.length < perPage) {
          break;
        }
        
        page++;
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Error fetching page ${page}:`, error.message);
        page++;
        if (page > maxPages) break;
      }
    }

    if (allCryptos.length > 0) {
      const uniqueCryptos = allCryptos.filter((crypto, index, self) =>
        index === self.findIndex((c) => c.id === crypto.id)
      );
      
      const sortedCryptos = uniqueCryptos.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      setCachedCryptoList(sortedCryptos);
      console.log(`Fetched and cached ${sortedCryptos.length} cryptocurrencies`);
      return sortedCryptos;
    }
  } catch (error) {
    console.error('Error fetching all cryptocurrencies:', error);
  }

  if (cached && cached.length > 0) {
    console.log(`Using expired cache with ${cached.length} items`);
    return cached;
  }

  console.warn('No cryptocurrency data available');
  return [];
};

export const cryptoAPI = {
  getAllCryptocurrencies: async () => {
    return await fetchAllCryptocurrencies();
  },

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
      const response = await axios.get(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN'
      );
      return response.data.Data || [];
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  },
};

export default api;