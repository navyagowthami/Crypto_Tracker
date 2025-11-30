import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaWallet, FaBell, FaNewspaper } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/portfolio', icon: FaWallet, label: 'Portfolio' },
    { path: '/alerts', icon: FaBell, label: 'Alerts' },
    { path: '/news', icon: FaNewspaper, label: 'News' },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">₿ Crypto Tracker</span>
            </Link>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-white text-blue-600 font-semibold'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

