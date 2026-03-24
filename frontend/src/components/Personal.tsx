import { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { translationAPI } from '../services/api';

interface Translation {
  id?: string;
  time: string;
  predictedWord: string;
  sentence: string;
  confidence?: number | null;
}

interface TopWord {
  label: string;
  value: number;
}

export default function Personal() {
  const PREDICTION_WINDOW_SIZE = 8;
  const RESUME_DELAY_MS = 1800;

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ASL');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [topWords, setTopWords] = useState<TopWord[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<string>('');
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [isCapturePaused, setIsCapturePaused] = useState(false);
  const [windowProgress, setWindowProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: PREDICTION_WINDOW_SIZE,
  });
  const [bufferStatus, setBufferStatus] = useState<string>('');
  const [serviceStatus, setServiceStatus] = useState<string>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const capturePausedRef = useRef(false);
  const generationInFlightRef = useRef(false);
  const modelBufferingRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);
  const windowLabelsRef = useRef<string[]>([]);
  const windowTop5Ref = useRef<any[][]>([]);

  // Check service status on mount
  useEffect(() => {
    checkServiceStatus();
    loadHistory();
  }, []);

  // Initialize webcam
  useEffect(() => {
    if (videoRef.current && isVideoOn) {
      setErrorMessage('');
      
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }, 
        audio: false 
      })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setErrorMessage('');
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          
          // Provide specific error messages based on error type
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setErrorMessage('📷 Camera access denied. Please click the camera icon in your browser\'s address bar and allow camera access, then refresh the page.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setErrorMessage('📷 No camera found. Please connect a camera and refresh the page.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setErrorMessage('📷 Camera is already in use by another application. Please close other apps using the camera.');
          } else {
            setErrorMessage(`📷 Camera error: ${err.message}. Please check your camera settings.`);
          }
          
          // Automatically turn off video when access fails
          setIsVideoOn(false);
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isVideoOn]);

  // Start/stop real-time translation
  useEffect(() => {
    if (isTranslating && isVideoOn) {
      startRealtimeTranslation();
    } else {
      stopRealtimeTranslation();
    }

    return () => {
      stopRealtimeTranslation();
    };
  }, [isTranslating, isVideoOn]);

  const checkServiceStatus = async () => {
    try {
      const status = await translationAPI.getStatus();
      if (status.model_service?.status === 'connected') {
        setServiceStatus('connected');
        setErrorMessage('');
      } else {
        setServiceStatus('disconnected');
        setErrorMessage(`Service unavailable: ${status.model_service?.message || 'Model service is offline'}`);
      }
    } catch (error) {
      setServiceStatus('error');
      setErrorMessage('Failed to connect to translation service');
    }
  };

  const formatTime = (isoDate?: string) => {
    if (!isoDate) return '--:--';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '--:--';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const loadHistory = async () => {
    try {
      const history = await translationAPI.getTranslationHistory(30);

      const historyItems = (history.items || []).map((item: any) => ({
        id: item.id,
        time: formatTime(item.created_at),
        predictedWord: item.predicted_word || '',
        sentence: item.sentence || '',
        confidence: item.confidence ?? null,
      }));

      setTranslations(historyItems);

      const topWordsResponse = (history.top_words || []).map((item: any) => ({
        label: item.label,
        value: item.count,
      }));
      setTopWords(topWordsResponse);
    } catch (error) {
      console.error('Failed to load translation history:', error);
    }
  };

  const updateTopWordsFromPrediction = (incomingTop5: any) => {
    if (!Array.isArray(incomingTop5)) return;
    const formatted = incomingTop5.map(([label, prob]: [string, number]) => ({ label, prob }));
    const normalized = formatted
      .map((item: any) => ({
        label: item.label,
        value: Math.round((Number(item.prob) || 0) * 100),
      }))
      .filter((item: TopWord) => Boolean(item.label))
      .slice(0, 5);
    console.log('Updating top words from prediction:', normalized);
    if (normalized.length > 0) {
      setTopWords(normalized);
    }
  };

  const resetPredictionWindow = () => {
    windowLabelsRef.current = [];
    windowTop5Ref.current = [];
    setWindowProgress({ current: 0, total: PREDICTION_WINDOW_SIZE });
  };

  const setCapturePausedState = (paused: boolean) => {
    capturePausedRef.current = paused;
    setIsCapturePaused(paused);
  };

  const scheduleCaptureResume = () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }

    resumeTimeoutRef.current = window.setTimeout(() => {
      if (!isTranslating) return;
      resetPredictionWindow();
      setCapturePausedState(false);
      setBufferStatus('Listening for next word window...');
    }, RESUME_DELAY_MS);
  };

  const requestSentenceGeneration = async (labels?: string[], top5?: any[][]) => {
    if (!isTranslating) return;
    if (generationInFlightRef.current) return;

    generationInFlightRef.current = true;
    modelBufferingRef.current = true;
    setIsGeneratingSentence(true);
    setCurrentPrediction('');
    setBufferStatus('Generating sentence...');

    try {
      const generated = await translationAPI.generateSentence(
        labels && labels.length > 0
          ? {
              labels,
              top5: top5 && top5.length > 0 ? top5 : undefined,
            }
          : undefined
      );
      const sentence = generated?.sentence || '';
      const predictedWord = generated?.predicted_word || currentPrediction;

      if (sentence) {
        setCurrentSentence(sentence);
      }

      const historyEntry = generated?.history_entry;
      if (historyEntry?.sentence) {
        const mappedEntry: Translation = {
          id: historyEntry.id,
          time: formatTime(historyEntry.created_at),
          predictedWord: historyEntry.predicted_word || predictedWord || '',
          sentence: historyEntry.sentence,
          confidence: historyEntry.confidence ?? null,
        };

        setTranslations(prev => {
          if (prev.length > 0 && prev[0].sentence === mappedEntry.sentence && prev[0].predictedWord === mappedEntry.predictedWord) {
            return prev;
          }
          return [mappedEntry, ...prev].slice(0, 50);
        });

        if (Array.isArray(historyEntry.top_words) && historyEntry.top_words.length > 0) {
          setTopWords(
            historyEntry.top_words
              .map((item: any) => ({
                label: item.label,
                value: Math.round((Number(item.prob) || 0) * 100),
              }))
              .slice(0, 5)
          );
        }
      }
    } catch (error) {
      console.error('Sentence generation failed:', error);
      setBufferStatus('Generation failed. Resuming capture...');
    } finally {
      generationInFlightRef.current = false;
      setIsGeneratingSentence(false);
      scheduleCaptureResume();
    }
  };

  const appendPredictionToWindow = (word: string, top5: any[] = []) => {
    if (capturePausedRef.current || generationInFlightRef.current) return;

    const nextLabels = [...windowLabelsRef.current, word].slice(-PREDICTION_WINDOW_SIZE);
    const nextTop5 = [...windowTop5Ref.current, top5].slice(-PREDICTION_WINDOW_SIZE);

    windowLabelsRef.current = nextLabels;
    windowTop5Ref.current = nextTop5;
    setWindowProgress({ current: nextLabels.length, total: PREDICTION_WINDOW_SIZE });

    if (nextLabels.length >= PREDICTION_WINDOW_SIZE) {
      setCapturePausedState(true);
      setBufferStatus('Window filled. Generating sentence...');
      requestSentenceGeneration(nextLabels, nextTop5);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const startRealtimeTranslation = async () => {
    // Reset buffer when starting new session
    try {
      await translationAPI.resetTranslation();
      setTranslations([]);
      setTopWords([]);
      setCurrentSentence('');
      setBufferStatus('Initializing...');
      resetPredictionWindow();
      setCapturePausedState(false);
      modelBufferingRef.current = false;
    } catch (error) {
      console.error('Failed to reset translation:', error);
    }

    const ws = translationAPI.openPredictWebSocket();
    wsRef.current = ws;

    ws.onopen = () => {
      setBufferStatus('Streaming frames...');

      intervalRef.current = window.setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (capturePausedRef.current || generationInFlightRef.current) return;

        const frameData = captureFrame();
        if (!frameData) return;

        try {
          wsRef.current.send(JSON.stringify({ image: frameData }));
        } catch (error) {
          console.error('Failed to send frame:', error);
        }
      }, 200); // 5 FPS
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const result = parsed?.type === 'inference' && parsed?.result
          ? {
              ...parsed.result,
              predicted_gloss: parsed.result.word,
            }
          : parsed;
        
        console.log('WebSocket message received:', result);

        if (result.status === 'buffering') {
          modelBufferingRef.current = true;
          setBufferStatus(result.message || 'Buffering frames...');
          setCurrentPrediction('');
          return;
        }

        if (result.predicted_gloss) {
          modelBufferingRef.current = false;
          if (capturePausedRef.current || generationInFlightRef.current) {
            return;
          }
          setCurrentPrediction(result.predicted_gloss);
          setBufferStatus(`Collecting words: ${windowLabelsRef.current.length}/${PREDICTION_WINDOW_SIZE}`);
          updateTopWordsFromPrediction(result.top5 || []);
          appendPredictionToWindow(result.predicted_gloss, result.top5 || []);
          return;
        }

        if (result.error) {
          console.error('Translation error:', result.error);
        }
      } catch (error) {
        console.error('Failed to parse websocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Predict websocket error:', error);
      setBufferStatus('WebSocket error');
    };

    ws.onclose = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  };

  const stopRealtimeTranslation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    generationInFlightRef.current = false;
    setCapturePausedState(false);
    modelBufferingRef.current = false;
    resetPredictionWindow();
    setCurrentPrediction('');
    setBufferStatus('');
    setIsGeneratingSentence(false);
  };

  const toggleTranslation = () => {
    if (serviceStatus !== 'connected') {
      setErrorMessage('Translation service is not available. Please check backend configuration.');
      return;
    }
    setIsTranslating(!isTranslating);
  };

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
                    className={`block w-full h-full object-cover transition-all duration-300 ${isGeneratingSentence || isCapturePaused ? 'blur-sm scale-105' : ''}`}
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

                {(isGeneratingSentence || isCapturePaused) && isTranslating && isVideoOn && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center text-white px-4">
                      <div className="w-10 h-10 border-2 border-white/60 border-t-white rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm md:text-base font-medium">Generating sentence...</p>
                      <p className="text-xs md:text-sm text-white/80 mt-1">Resuming prediction shortly</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Indicators */}
              <div className="absolute top-3 md:top-4 left-3 md:left-4 flex gap-2 flex-wrap z-20">
                <div className={`${
                  serviceStatus === 'connected' 
                    ? 'bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600' 
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600'
                } text-white px-2.5 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 shadow-lg text-xs md:text-sm`}>
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse" />
                  <span>{serviceStatus === 'connected' ? 'Ready' : 'Offline'}</span>
                </div>
                {isTranslating && (
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white px-2.5 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 shadow-lg text-xs md:text-sm">
                    <Languages className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Translating</span>
                  </div>
                )}
              </div>
              
              {/* Hidden canvas for frame capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

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
              <div className="absolute bottom-16 md:bottom-20 left-4 right-4 md:left-6 md:right-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 md:px-6 lg:px-8 py-3 md:py-4 shadow-lg">
                <div className="flex items-start gap-2 md:gap-3">
                  <Languages className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 mt-0.5 md:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {currentPrediction ? (
                      <>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white break-words">
                          [{currentPrediction}]
                        </p>
                        <p className={`mt-1 text-sm md:text-lg text-gray-700 dark:text-gray-200 break-words transition-all duration-300 ${isGeneratingSentence ? 'animate-pulse opacity-70' : 'opacity-100'}`}>
                          {currentSentence ? `"${currentSentence}"` : (isGeneratingSentence ? 'Generating sentence...' : 'Waiting for sentence...')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs md:text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
                            Live
                          </span>
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            Window {windowProgress.current}/{windowProgress.total}
                          </span>
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{selectedLanguage} to English</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm md:text-base text-gray-900 dark:text-white break-words">
                          {bufferStatus || 'Waiting for signs...'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs md:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
                            Processing
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {errorMessage && (
              <div className="absolute bottom-16 md:bottom-20 left-4 right-4 md:left-6 md:right-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl px-4 py-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">{errorMessage}</p>
                    {errorMessage.includes('denied') && (
                      <div className="text-xs text-red-800 dark:text-red-200 space-y-1 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                        <p className="font-semibold">How to fix:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Look for the camera icon (🔒🎥) in your browser's address bar</li>
                          <li>Click it and select \"Allow\" for camera access</li>
                          <li>Refresh this page (F5 or Ctrl+R)</li>
                        </ol>
                      </div>
                    )}
                    {!errorMessage.includes('denied') && errorMessage.includes('in use') && (
                      <div className="text-xs text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                        <p>Close any other apps or browser tabs using your camera, then click the video button to retry.</p>
                      </div>
                    )}
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
                  onClick={toggleTranslation}
                  disabled={serviceStatus !== 'connected' || !isVideoOn}
                  title={serviceStatus !== 'connected' ? 'Translation service unavailable' : 'Start/Stop translation'}
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
                    <h3 className="text-gray-900 dark:text-white text-sm md:text-base">Translation Output</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{translations.length} sentence logs</p>
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

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Top Words</p>
                  <div className="space-y-2">
                    {topWords.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No predictions yet</p>
                    )}
                    {topWords.map((word, index) => (
                      <div key={`${word.label}-${index}`} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-900 dark:text-white">{word.label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{word.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, word.value))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {translations.map((translation, index) => (
                  <div key={translation.id || index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{translation.time}</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">[{translation.predictedWord}]</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">"{translation.sentence}"</p>
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
