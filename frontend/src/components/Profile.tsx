import { useState, useEffect } from 'react';
import { Camera, Mail, Phone, MapPin, Calendar, Shield, Bell, Languages, Edit2, Save, X, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function Profile() {
  const { isDarkMode, setTheme } = useTheme();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    joinDate: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    preferredLanguage: 'ASL (American Sign Language)',
  });

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username,
        email: user.email,
        joinDate: new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      }));
    }
  }, [user]);

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
  };

  const stats = [
    { label: 'Total Sessions', value: '124', icon: Calendar, color: 'blue' },
    { label: 'Hours Translated', value: '48.5', icon: Languages, color: 'purple' },
    { label: 'Accuracy Rate', value: '94%', icon: Shield, color: 'green' },
  ];

  const settings = [
    { icon: Bell, label: 'Notifications', description: 'Manage notification preferences', enabled: true },
    { icon: Shield, label: 'Privacy', description: 'Control your privacy settings', enabled: true },
    { icon: Languages, label: 'Language', description: 'Set your preferred sign language', enabled: true },
  ];

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 transition-colors overflow-hidden">
      
      <main className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-4 lg:p-4">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <h1 className="text-gray-900 dark:text-white mb-2">Profile Settings</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6">
              {/* Profile Card */}
              <Card className="p-4 md:p-6 border-none bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <span className="text-3xl md:text-4xl font-semibold">
                        {formData.username ? formData.username.substring(0, 2).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-100 dark:border-gray-700 hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  <h3 className="text-gray-900 dark:text-white mb-1">{formData.username}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formData.email}</p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Member since</p>
                      <p className="text-gray-900 dark:text-white font-medium">{formData.joinDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Preferred Language</p>
                      <p className="text-gray-900 dark:text-white font-medium">ASL</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <Card className="p-4 md:p-6 border-none bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg">
                <h3 className="text-gray-900 dark:text-white mb-3 md:mb-4 text-base md:text-lg">Statistics</h3>
                <div className="space-y-3 md:space-y-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                    };
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Personal Information */}
              <Card className="p-4 md:p-6 border-none bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-gray-900 dark:text-white">Personal Information</h3>
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="gap-2 text-gray-900 dark:text-white"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Username</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">{formData.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {formData.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {formData.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {formData.location}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Preferred Sign Language</label>
                    {isEditing ? (
                      <select
                        value={formData.preferredLanguage}
                        onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>ASL (American Sign Language)</option>
                        <option>BSL (British Sign Language)</option>
                        <option>ISL (Indian Sign Language)</option>
                        <option>JSL (Japanese Sign Language)</option>
                      </select>
                    ) : (
                      <p className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Languages className="w-4 h-4 text-gray-400" />
                        {formData.preferredLanguage}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Settings */}
              <Card className="p-4 md:p-6 border-none bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white">Preferences</h3>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {/* Theme Selector */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? (
                        <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
                      </div>
                    </div>
                    <select
                      value={isDarkMode ? 'dark' : 'light'}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                      className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  
                  {settings.map((setting, index) => {
                    const Icon = setting.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                          </div>
                        </div>
                        <button className={`relative w-12 h-6 rounded-full transition-colors ${setting.enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${setting.enabled ? 'left-6' : 'left-0.5'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
