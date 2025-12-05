import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaWallet, FaBell, FaNewspaper, FaUser, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">₿ Crypto Tracker</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Portfolio Link */}
            <Link
              to="/portfolio"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/portfolio')
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <FaWallet className="w-5 h-5" />
              <span className="hidden sm:inline">Portfolio</span>
            </Link>

            {/* Alerts Link */}
            <Link
              to="/alerts"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/alerts')
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <FaBell className="w-5 h-5" />
              <span className="hidden sm:inline">Alerts</span>
            </Link>

            {/* News Link */}
            <Link
              to="/news"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/news')
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <FaNewspaper className="w-5 h-5" />
              <span className="hidden sm:inline">News</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-white hover:bg-white/20"
              >
                <FaUser className="w-5 h-5" />
                <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
                <FaChevronDown className={`w-3 h-3 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

