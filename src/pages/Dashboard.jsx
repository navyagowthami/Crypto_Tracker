import { useState, useEffect } from 'react';
import { cryptoAPI } from '../services/api';
import CryptoCard from '../components/CryptoCard';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [allCryptos, setAllCryptos] = useState([]);
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchAllCryptos();
    const interval = setInterval(fetchAllCryptos, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allCryptos.length === 0) {
      setCryptos([]);
      return;
    }

    if (searchTerm.trim()) {
      return;
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = allCryptos.slice(startIndex, endIndex);
    
    setCryptos(pageData);
  }, [page, allCryptos, itemsPerPage, searchTerm]);

  const fetchAllCryptos = async () => {
    try {
      setLoading(true);
      const allData = await cryptoAPI.getAllCryptocurrencies();
      
      if (allData && allData.length > 0) {
        setAllCryptos(allData);
        console.log(`Loaded ${allData.length} cryptocurrencies for dashboard`);
      } else {
        toast.error('Failed to load cryptocurrency data.');
        setAllCryptos([]);
      }
    } catch (error) {
      toast.error('Failed to fetch crypto data. Please try again later.');
      console.error(error);
      setAllCryptos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = searchTerm.trim()
    ? allCryptos.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cryptos;

  const totalPages = Math.ceil(allCryptos.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Crypto Market Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time cryptocurrency prices and market data
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Reset to page 1 when search is cleared
                if (!e.target.value.trim() && page !== 1) {
                  setPage(1);
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <>
            {/* Crypto Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCryptos.map((crypto) => (
                <CryptoCard key={crypto.id} crypto={crypto} />
              ))}
            </div>

            {filteredCryptos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No cryptocurrencies found matching your search.
                </p>
              </div>
            )}

            {/* Pagination */}
            {!searchTerm && allCryptos.length > itemsPerPage && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages} ({allCryptos.length} total)
                </span>
                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            
            {searchTerm && (
              <div className="mt-8 text-center text-gray-600">
                Showing {filteredCryptos.length} of {allCryptos.length} cryptocurrencies
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

