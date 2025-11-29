import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Languages, Settings, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/personal', icon: User, label: 'Personal' },
    { path: '/translator', icon: MessageSquare, label: 'Translator' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 p-4 pr-0">
      <div className="w-20 h-[calc(100vh-2rem)] bg-white dark:bg-gray-900 rounded-xl flex flex-col justify-between p-3 pt-7 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3),0_4px_8px_3px_rgba(0,0,0,0.15)] dark:border dark:border-gray-800">

        {/* Company Logo */}
        <Link
          to="/home"
          className="group relative flex items-center justify-center mb-6 rounded-2xl transition-all duration-200"    
        >
          <div className="w-10 h-10  flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <Languages className="text-blue-600 dark:text-blue-400 w-6 h-6" strokeWidth={2.5} />
          </div>
        
        </Link>

        {/* Separator */}
        <div className="w-full h-px bg-gray-200 dark:bg-gray-800 mb-6" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group relative flex items-center justify-center w-full p-3 rounded-2xl
                  transition-all duration-200 mb-2
                `}
              >
                {/* Active Indicator - Blue dot/line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}

                {/* Icon */}
                <div className="flex items-center justify-center w-6 h-6 transition-transform duration-200 group-hover:scale-110">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-[#e8eaed]'}`} strokeWidth={2} />
                </div>

              </Link>
            );
          })}
        </nav>

        {/* Footer with Settings and Logout */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <Link
            to="/profile"
            className="group relative flex items-center justify-center w-full p-3 rounded-2xl text-gray-600 dark:text-[#e8eaed] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-6 h-6 transition-transform duration-200 group-hover:scale-110">
              <Settings className="w-5 h-5" strokeWidth={2} />
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="group relative flex items-center justify-center w-full p-3 rounded-2xl text-gray-600 dark:text-[#e8eaed] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-6 h-6 transition-transform duration-200 group-hover:scale-110">
              <LogOut className="w-5 h-5" strokeWidth={2} />
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}