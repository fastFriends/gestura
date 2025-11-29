import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Calendar, Settings, Clock, Plus, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function Home() {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: Video,
      title: 'New Translation Session',
      description: 'Start a new sign language translation session',
      action: () => navigate('/personal'),
      primary: true,
      gradient: 'from-blue-600 to-blue-500',
    },
    {
      icon: Users,
      title: 'Join with Code',
      description: 'Join an existing translation session',
      action: () => navigate('/translator'),
      primary: false,
      gradient: 'from-purple-600 to-purple-500',
    },
  ];

  const recentSessions = [
    {
      title: 'ASL Translation Session',
      date: 'Nov 26, 2024',
      duration: '45 min',
      participants: 3,
      status: 'completed',
    },
    {
      title: 'Team Meeting Translation',
      date: 'Nov 25, 2024',
      duration: '1 hr 15 min',
      participants: 5,
      status: 'completed',
    },
    {
      title: 'Personal Practice',
      date: 'Nov 24, 2024',
      duration: '30 min',
      participants: 1,
      status: 'completed',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Real-time Translation',
      description: 'Instant AI-powered sign language recognition',
      color: 'blue',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'End-to-end encrypted sessions',
      color: 'green',
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track accuracy and improvement',
      color: 'orange',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      
      <main className="h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          {/* Hero Section */}
          <div className="mb-4 md:mb-6">
            <h1 className="text-gray-900 dark:text-white mb-2 md:mb-3">Welcome to Sign Language Translator</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Real-time sign language translation powered by advanced AI technology
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card
                  key={index}
                  className={`border-none group p-4 md:p-5 cursor-pointer transition-all hover:shadow-xl dark:bg-gray-900 dark:hover:bg-gray-850 dark:border-gray-800 bg-white shadow-lg ${
                    action.primary ? 'border-blue-600 dark:border-blue-500 border-2' : 'hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                  onClick={action.action}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${action.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 dark:text-white mb-1.5 text-base md:text-lg">{action.title}</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Sessions */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h2 className="text-gray-900 dark:text-white mb-1">Recent Sessions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{recentSessions.length} sessions this week</p>
              </div>
              <Button variant="ghost" className="gap-2 text-sm dark:text-gray-300 dark:hover:bg-gray-800 hover:bg-gray-100">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">View All</span>
              </Button>
            </div>

            <div className="grid gap-3 md:gap-4">
              {recentSessions.map((session, index) => (
                <Card key={index} className="border-none group p-3 md:p-4 hover:shadow-xl transition-all cursor-pointer bg-white dark:bg-gray-900 dark:hover:bg-gray-850 dark:border-gray-800 border hover:border-blue-200 dark:hover:border-blue-800 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Video className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-gray-900 dark:text-white mb-1 text-sm md:text-base truncate">{session.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                            {session.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            {session.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 md:w-4 md:h-4" />
                            {session.participants}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="self-start sm:self-center dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm">View Details</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'from-blue-600 to-blue-500',
                green: 'from-green-600 to-green-500',
                orange: 'from-orange-600 to-orange-500',
              };
              const iconBgClasses = {
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
              };
              return (
                <Card key={index} className="border-none group p-4 md:p-5 hover:shadow-xl transition-all cursor-pointer dark:bg-gray-900 dark:hover:bg-gray-850 dark:border-gray-800 border hover:border-gray-300 dark:hover:border-gray-700 bg-white shadow-lg">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 ${iconBgClasses[feature.color as keyof typeof iconBgClasses]} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white mb-1.5 md:mb-2 text-base md:text-lg">{feature.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
