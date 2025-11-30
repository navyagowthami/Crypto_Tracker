import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const CryptoCard = ({ crypto, onClick }) => {
  const isPositive = crypto.price_change_percentage_24h >= 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={crypto.image}
            alt={crypto.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-bold text-lg text-gray-800">{crypto.name}</h3>
            <p className="text-sm text-gray-500 uppercase">{crypto.symbol}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            ${crypto.current_price?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isPositive ? (
            <FaArrowUp className="text-green-500" />
          ) : (
            <FaArrowDown className="text-red-500" />
          )}
          <span
            className={`font-semibold ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {Math.abs(crypto.price_change_percentage_24h)?.toFixed(2)}%
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <p>Market Cap: ${crypto.market_cap?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoCard;

