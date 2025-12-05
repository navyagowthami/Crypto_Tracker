import { useState, useEffect } from 'react';
import { portfolioAPI, cryptoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaSpinner } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [formData, setFormData] = useState({
    coinId: '',
    coinName: '',
    symbol: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: '',
  });

  useEffect(() => {
    if (user) {
      setCryptoList([]);
      fetchPortfolio();
      fetchCryptoList();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getAll();
      const portfolioData = response.data;
      
      const updatedPortfolio = await Promise.all(
        portfolioData.map(async (item) => {
          try {
            const coinData = await cryptoAPI.getCoinDetails(item.coinId);
            const currentPrice = coinData?.market_data?.current_price?.usd ?? 0;
            return {
              ...item,
              currentPrice,
            };
          } catch (error) {
            return { ...item, currentPrice: 0 };
          }
        })
      );
      
      setPortfolio(updatedPortfolio);
    } catch (error) {
      toast.error('Failed to fetch portfolio');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoList = async () => {
    try {
      const allCryptos = await cryptoAPI.getAllCryptocurrencies();
      
      if (allCryptos && allCryptos.length > 0) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedCrypto = cryptoList.find((c) => c.id === formData.coinId);
      
      const portfolioItem = {
        coinId: formData.coinId,
        coinName: formData.coinName || selectedCrypto?.name,
        symbol: formData.symbol || selectedCrypto?.symbol.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        purchaseDate: formData.purchaseDate,
      };

      if (editingItem) {
        await portfolioAPI.update(editingItem.id, portfolioItem);
        toast.success('Portfolio item updated successfully');
      } else {
        await portfolioAPI.create(portfolioItem);
        toast.success('Portfolio item added successfully');
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        coinId: '',
        coinName: '',
        symbol: '',
        quantity: '',
        purchasePrice: '',
        purchaseDate: '',
      });
      fetchPortfolio();
    } catch (error) {
      toast.error('Failed to save portfolio item');
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      coinId: item.coinId,
      coinName: item.coinName,
      symbol: item.symbol,
      quantity: item.quantity.toString(),
      purchasePrice: item.purchasePrice.toString(),
      purchaseDate: item.purchaseDate,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await portfolioAPI.delete(id);
        toast.success('Portfolio item deleted successfully');
        fetchPortfolio();
      } catch (error) {
        toast.error('Failed to delete portfolio item');
        console.error(error);
      }
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Crypto Portfolio Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = portfolio.map((item) => {
      const totalValue = item.quantity * item.currentPrice;
      const totalCost = item.quantity * item.purchasePrice;
      const profitLoss = totalValue - totalCost;
      const profitLossPercent = ((profitLoss / totalCost) * 100).toFixed(2);

      return [
        item.coinName,
        item.symbol,
        item.quantity.toFixed(4),
        `$${item.purchasePrice.toFixed(2)}`,
        `$${item.currentPrice.toFixed(2)}`,
        `$${totalValue.toFixed(2)}`,
        `$${profitLoss.toFixed(2)}`,
        `${profitLossPercent}%`,
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Coin', 'Symbol', 'Quantity', 'Purchase Price', 'Current Price', 'Total Value', 'P/L', 'P/L %']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    const totalPortfolioValue = portfolio.reduce(
      (sum, item) => sum + item.quantity * item.currentPrice,
      0
    );
    const totalCost = portfolio.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );
    const totalProfitLoss = totalPortfolioValue - totalCost;

    doc.setFontSize(12);
    const tableBottom = doc.lastAutoTable?.finalY ?? 40;
    doc.text(`Total Portfolio Value: $${totalPortfolioValue.toFixed(2)}`, 14, tableBottom + 10);
    doc.text(`Total Cost: $${totalCost.toFixed(2)}`, 14, tableBottom + 16);
    doc.text(`Total P/L: $${totalProfitLoss.toFixed(2)}`, 14, tableBottom + 22);

    doc.save('crypto-portfolio.pdf');
    toast.success('Portfolio exported to PDF');
  };

  const calculateTotalValue = () => {
    return portfolio.reduce((sum, item) => sum + item.quantity * item.currentPrice, 0);
  };

  const calculateTotalCost = () => {
    return portfolio.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);
  };

  const totalValue = calculateTotalValue();
  const totalCost = calculateTotalCost();
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? ((totalProfitLoss / totalCost) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Portfolio</h1>
            <p className="text-gray-600">Track your cryptocurrency investments</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  coinId: '',
                  coinName: '',
                  symbol: '',
                  quantity: '',
                  purchasePrice: '',
                  purchaseDate: '',
                });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalValue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total P/L</p>
            <p
              className={`text-2xl font-bold ${
                totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ${totalProfitLoss.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">P/L %</p>
            <p
              className={`text-2xl font-bold ${
                totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalProfitLossPercent}%
            </p>
          </div>
        </div>

        {/* Portfolio Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P/L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No portfolio items yet. Add your first investment!
                      </td>
                    </tr>
                  ) : (
                    portfolio.map((item) => {
                      const totalValue = item.quantity * item.currentPrice;
                      const totalCost = item.quantity * item.purchasePrice;
                      const profitLoss = totalValue - totalCost;
                      const profitLossPercent = ((profitLoss / totalCost) * 100).toFixed(2);

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.coinName}
                              </div>
                              <div className="text-sm text-gray-500">{item.symbol}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.purchasePrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.currentPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${totalValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div
                                className={`font-medium ${
                                  profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                ${profitLoss.toFixed(2)}
                              </div>
                              <div
                                className={`text-xs ${
                                  profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}
                              >
                                {profitLossPercent}%
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="relative rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl my-auto overflow-hidden" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
            }}>
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='30' y='30' font-size='30' fill='white' text-anchor='middle'%3E₿%3C/text%3E%3C/svg%3E")`,
                backgroundSize: '80px 80px'
              }}></div>
              
              <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-lg p-6 -m-6">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
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
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
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

export default Portfolio;

