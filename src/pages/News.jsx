import { useState, useEffect } from 'react';
import { cryptoAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaSpinner, FaExternalLinkAlt, FaCalendar } from 'react-icons/fa';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredNews, setFilteredNews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = news.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.body?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNews(filtered);
    } else {
      setFilteredNews(news);
    }
  }, [searchTerm, news]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await cryptoAPI.getNews();
      setNews(data);
      setFilteredNews(data);
    } catch (error) {
      toast.error('Failed to fetch news. Using fallback data.');
      setNews([
        {
          id: 1,
          title: 'Bitcoin Reaches New All-Time High',
          body: 'Bitcoin has reached a new all-time high, breaking previous records...',
          url: '#',
          imageurl: 'https://via.placeholder.com/400x200',
          published_on: Math.floor(Date.now() / 1000) - 3600,
          source: 'CryptoNews',
        },
        {
          id: 2,
          title: 'Ethereum 2.0 Staking Update',
          body: 'Ethereum continues to see significant staking activity...',
          url: '#',
          imageurl: 'https://via.placeholder.com/400x200',
          published_on: Math.floor(Date.now() / 1000) - 7200,
          source: 'BlockchainDaily',
        },
      ]);
      setFilteredNews([
        {
          id: 1,
          title: 'Bitcoin Reaches New All-Time High',
          body: 'Bitcoin has reached a new all-time high, breaking previous records...',
          url: '#',
          imageurl: 'https://via.placeholder.com/400x200',
          published_on: Math.floor(Date.now() / 1000) - 3600,
          source: 'CryptoNews',
        },
        {
          id: 2,
          title: 'Ethereum 2.0 Staking Update',
          body: 'Ethereum continues to see significant staking activity...',
          url: '#',
          imageurl: 'https://via.placeholder.com/400x200',
          published_on: Math.floor(Date.now() / 1000) - 7200,
          source: 'BlockchainDaily',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000) - timestamp;
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Crypto News</h1>
          <p className="text-gray-600">Stay updated with the latest cryptocurrency news</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <>
            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No news found matching your search.</p>
                </div>
              ) : (
                filteredNews.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {item.imageurl && (
                      <img
                        src={item.imageurl}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 uppercase">
                          {item.source || 'Crypto News'}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <FaCalendar className="mr-1" />
                          {getTimeAgo(item.published_on)}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {item.body || item.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(item.published_on)}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <span>Read more</span>
                          <FaExternalLinkAlt className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredNews.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  Showing {filteredNews.length} of {news.length} articles
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default News;

