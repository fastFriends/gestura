import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Monitor,
  Maximize2,
  Languages,
  Volume2,
  Camera,
  BarChart3,
  Download,
  Share2,
  MoreVertical
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function Personal() {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ASL');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && isVideoOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.log('Error accessing camera:', err));
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn]);

  const translations = [
    { time: '00:15', text: 'Hello', confidence: 95 },
    { time: '00:18', text: 'How are you?', confidence: 92 },
    { time: '00:23', text: 'Nice to meet you', confidence: 88 },
    { time: '00:28', text: 'Thank you', confidence: 94 },
    { time: '00:32', text: 'Good morning', confidence: 96 },
  ];

  const languages = ['ASL', 'BSL', 'ISL', 'JSL'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      <main className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:p-4 lg:p-4 overflow-hidden">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Video Container */}
            <Card className="flex-1 bg-black dark:bg-gray-950 rounded-xl lg:rounded-2xl overflow-hidden relative border-gray-200 dark:border-gray-800 shadow-lg min-h-[300px] md:min-h-[400px]">
              <div className="absolute inset-0 z-0">
                {isVideoOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="block w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 dark:bg-gray-900">
                    <div className="text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gray-700 dark:bg-gray-800 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center">
                        <VideoOff className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm md:text-base text-gray-400 dark:text-gray-500">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Indicators */}
              <div className="absolute top-3 md:top-4 left-3 md:left-4 flex gap-2 flex-wrap z-20">
                <div className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-600 text-white px-2.5 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 shadow-lg text-xs md:text-sm">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse" />
                  <span>Practice Mode</span>
                </div>
                {isTranslating && (
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white px-2.5 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 shadow-lg text-xs md:text-sm">
                    <Languages className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Top Right Actions */}
              <div className="absolute top-3 md:top-4 right-3 md:right-4 flex gap-2 z-20">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-900/80 hover:bg-gray-800/80 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 border-0 shadow-lg"
                >
                  <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                </Button>
              </div>
            </Card>

            {/* Translation Overlay */}
            {isTranslating && (
              <div className="bottom-16 md:bottom-20 left-4 right-4 md:left-6 md:right-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 md:px-6 lg:px-8 py-3 md:py-4 shadow-lg">
                <div className="flex items-start gap-2 md:gap-3">
                  <Languages className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 mt-0.5 md:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base text-gray-900 dark:text-white break-words">
                      Translating sign language in real-time...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs md:text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
                        Live
                      </span>
                      <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{selectedLanguage} to English</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white dark:bg-gray-900 rounded-xl px-3 md:px-4 py-2 md:py-3 shadow-lg border border-gray-200 dark:border-gray-800 gap-2 sm:gap-3 flex-shrink-0">
              {/* Left Side - Session Info */}
              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm order-2 sm:order-1">
                <span className="text-gray-600 dark:text-gray-400">12:34</span>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">Practice Session</span>
              </div>

              {/* Center - Main Controls */}
              <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
                <Button
                  size="icon"
                  className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all ${isAudioOn
                      ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
                    }`}
                  onClick={() => setIsAudioOn(!isAudioOn)}
                >
                  {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>

                <Button
                  size="icon"
                  className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all ${isVideoOn
                      ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
                    }`}
                  onClick={() => setIsVideoOn(!isVideoOn)}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>

                <Button
                  size="icon"
                  className={`h-11 w-11 md:h-12 md:w-12 rounded-full transition-all shadow-lg ${isTranslating
                      ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
                    }`}
                  onClick={() => setIsTranslating(!isTranslating)}
                >
                  <Languages className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <Monitor className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  className="hidden md:flex h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              {/* Right Side - Additional Actions */}
              <div className="flex items-center justify-end gap-1.5 md:gap-2 order-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex h-8 w-8 md:h-9 md:w-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex h-8 w-8 md:h-9 md:w-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 min-h-0">
            {/* Translation Output */}
            <Card className=" border-none flex-1 p-4 md:p-5 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white text-sm md:text-base">Translation Log</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{translations.length} translations</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-gray-800">
                    <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-gray-800">
                    <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {translations.map((translation, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{translation.time}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 dark:bg-green-400 rounded-full"
                            style={{ width: `${translation.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{translation.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{translation.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Settings Panel */}
            <Card className="border-none p-4 md:p-5 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white text-sm md:text-base">Quick Settings</h3>
              </div>
              <div className="space-y-1.5">
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Sign Language</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedLanguage}</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Voice Output</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Enabled</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                        <Camera className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Recording</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Off</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                        <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Statistics</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">View performance</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
