import { useState, useEffect } from 'react';
import { alertsAPI, cryptoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaBell, FaSpinner } from 'react-icons/fa';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    coinId: '',
    coinName: '',
    symbol: '',
    targetPrice: '',
    condition: 'above', 
    isActive: true,
  });

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      // Clear crypto list when user changes to force refetch
      setCryptoList([]);
      await fetchAlerts();
      await fetchCryptoList();
      // Initial check after loading
      setTimeout(checkAlerts, 2000);
    };
    
    loadData();
    
    // Check alerts every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getAll();
      setAlerts(response.data);
    } catch (error) {
      toast.error('Failed to fetch alerts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoList = async () => {
    try {
      // Use the shared cached cryptocurrency list (same for all users)
      const allCryptos = await cryptoAPI.getAllCryptocurrencies();
      
      if (allCryptos && allCryptos.length > 0) {
        // Already sorted alphabetically and deduplicated by the API function
        setCryptoList(allCryptos);
        console.log(`Loaded ${allCryptos.length} cryptocurrencies for dropdown`);
      } else {
        console.warn('No cryptocurrency data available');
        setCryptoList([]);
      }
    } catch (error) {
      console.error('Failed to fetch crypto list', error);
      setCryptoList([]);
    }
  };

  const checkAlerts = async () => {
    try {
      // Fetch fresh alerts to avoid stale data
      const response = await alertsAPI.getAll();
      const currentAlerts = response.data;
      const activeAlerts = currentAlerts.filter((alert) => alert.isActive);
      
      for (const alert of activeAlerts) {
        try {
          const coinData = await cryptoAPI.getCoinDetails(alert.coinId);
          const currentPrice = coinData?.market_data?.current_price?.usd || 0;
          
          let triggered = false;
          if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
            triggered = true;
          } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
            triggered = true;
          }

          if (triggered) {
            toast.info(
              `🚨 Alert: ${alert.coinName} (${alert.symbol}) is now $${currentPrice.toFixed(2)} (${alert.condition === 'above' ? 'above' : 'below'} $${alert.targetPrice})`,
              { autoClose: 10000 }
            );
            // Deactivate alert after triggering
            await alertsAPI.update(alert.id, { ...alert, isActive: false });
            fetchAlerts();
          }
        } catch (error) {
          console.error(`Error checking alert for ${alert.coinName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedCrypto = cryptoList.find((c) => c.id === formData.coinId);
      
      const alertData = {
        coinId: formData.coinId,
        coinName: formData.coinName || selectedCrypto?.name,
        symbol: formData.symbol || selectedCrypto?.symbol.toUpperCase(),
        targetPrice: parseFloat(formData.targetPrice),
        condition: formData.condition,
        isActive: formData.isActive,
      };

      if (editingAlert) {
        await alertsAPI.update(editingAlert.id, alertData);
        toast.success('Alert updated successfully');
      } else {
        await alertsAPI.create(alertData);
        toast.success('Alert created successfully');
      }

      setShowModal(false);
      setEditingAlert(null);
      setFormData({
        coinId: '',
        coinName: '',
        symbol: '',
        targetPrice: '',
        condition: 'above',
        isActive: true,
      });
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to save alert');
      console.error(error);
    }
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      coinId: alert.coinId,
      coinName: alert.coinName,
      symbol: alert.symbol,
      targetPrice: alert.targetPrice.toString(),
      condition: alert.condition,
      isActive: alert.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await alertsAPI.delete(id);
        toast.success('Alert deleted successfully');
        fetchAlerts();
      } catch (error) {
        toast.error('Failed to delete alert');
        console.error(error);
      }
    }
  };

  const handleToggleActive = async (alert) => {
    try {
      await alertsAPI.update(alert.id, { ...alert, isActive: !alert.isActive });
      toast.success(`Alert ${!alert.isActive ? 'activated' : 'deactivated'}`);
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to update alert');
      console.error(error);
    }
  };

  const handleCryptoSelect = (coinId) => {
    const selected = cryptoList.find((c) => c.id === coinId);
    if (selected) {
      setFormData({
        ...formData,
        coinId: selected.id,
        coinName: selected.name,
        symbol: selected.symbol.toUpperCase(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Price Alerts</h1>
            <p className="text-gray-600">Set alerts for cryptocurrency price movements</p>
          </div>
          <button
            onClick={() => {
              setEditingAlert(null);
              setFormData({
                coinId: '',
                coinName: '',
                symbol: '',
                targetPrice: '',
                condition: 'above',
                isActive: true,
              });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
            <span>Create Alert</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
                <FaBell className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No alerts yet. Create your first alert!</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    alert.isActive
                      ? 'border-blue-500'
                      : 'border-gray-300 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{alert.coinName}</h3>
                      <p className="text-sm text-gray-500">{alert.symbol}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        alert.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Target Price</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${alert.targetPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Condition</p>
                      <p className="text-sm font-medium text-gray-900">
                        Alert when price goes {alert.condition === 'above' ? 'above' : 'below'} target
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleToggleActive(alert)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        alert.isActive
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {alert.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(alert)}
                      className="px-3 py-2 text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="relative rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
              backgroundSize: '400% 400%',
              animation: 'gradientShift 12s ease infinite'
            }}>
              {/* Animated Pattern Overlay */}
              <div className="absolute inset-0 opacity-15" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='40' y='40' font-size='35' fill='white' text-anchor='middle'%3E🔔%3C/text%3E%3C/svg%3E"), url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='30' y='30' font-size='25' fill='white' text-anchor='middle' opacity='0.6'%3E₿%3C/text%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px, 100px 100px',
                backgroundPosition: '0 0, 60px 60px'
              }}></div>
              
              <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-lg p-6 -m-6">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingAlert ? 'Edit Alert' : 'Create Alert'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cryptocurrency
                  </label>
                  <select
                    value={formData.coinId}
                    onChange={(e) => handleCryptoSelect(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="">Select a cryptocurrency ({cryptoList.length} available)</option>
                    {cryptoList.map((crypto) => (
                      <option key={crypto.id} value={crypto.id}>
                        {crypto.name} ({crypto.symbol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    All cryptocurrencies are listed alphabetically. Use the dropdown scrollbar to navigate.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, targetPrice: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="above">Alert when price goes above</option>
                    <option value="below">Alert when price goes below</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingAlert ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAlert(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;

