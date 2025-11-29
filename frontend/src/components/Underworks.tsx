import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Wrench } from 'lucide-react';

const Underworks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <main className="h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-2xl p-6 md:p-8 bg-white dark:bg-gray-900 shadow-lg">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-sky-400 text-white flex items-center justify-center shadow-xl transform-gpu animate-float">
                  <Wrench className="w-8 h-8" />
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">Underworks</h1>

                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-xl">
                  This page is currently being built. We're aligning the layout and polishing the
                  user experience so it matches the rest of the application. Come back soon for the
                  finished view.
                </p>

                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate('/home')}>Go Home</Button>
                  <Button
                    variant="default"
                    onClick={() => alert("Thanks — we'll notify you when this page is ready.")}
                  >
                    Notify Me
                  </Button>
                </div>

                <small className="text-xs text-gray-400 mt-3">Estimated ready: a few days</small>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Underworks;
