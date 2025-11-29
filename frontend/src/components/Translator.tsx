import { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  MessageSquare,
  Users,
  MoreVertical,
  Monitor,
  Hand,
  Maximize2,
  Copy,
  Check,
  Languages,
  Settings,
  Share2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

export default function Translator() {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
 

  const meetingId = '123-456-789';

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

  const handleCopyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    toast.success('Meeting ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const participants = [
    { id: 1, name: 'You', isPresenting: true, isMuted: false, isVideoOn: true },
    { id: 2, name: 'John Smith', isPresenting: false, isMuted: true, isVideoOn: false },
    { id: 3, name: 'Sarah Johnson', isPresenting: false, isMuted: false, isVideoOn: false },
    { id: 4, name: 'Mike Wilson', isPresenting: false, isMuted: false, isVideoOn: false },
  ];

  const presenter = participants.find(p => p.isPresenting);

  const chatMessages = [
    { id: 1, sender: 'John Smith', message: 'Can you slow down a bit?', time: '2:34 PM' },
    { id: 2, sender: 'You', message: 'Sure, no problem!', time: '2:35 PM' },
    { id: 3, sender: 'Sarah Johnson', message: 'The translation is working great!', time: '2:36 PM' },
  ];

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 transition-colors overflow-hidden">
      
      <main className="h-full flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 md:p-4 overflow-hidden">
          {/* Left Side - Video Content */}
          <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
            {/* Main Video Area */}
            <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
            {/* Presenter Video - Center */}
            {(() => {
              return presenter ? (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <Card className="flex-1 bg-black dark:bg-gray-950 rounded-xl overflow-hidden relative border-gray-200 dark:border-gray-800 shadow-lg">
                    {presenter.id === 1 && isVideoOn ? (
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
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <span className="text-white font-semibold text-2xl md:text-3xl">{presenter.name[0]}</span>
                          </div>
                          <p className="text-lg text-gray-300 dark:text-gray-400">{presenter.name}</p>
                          {!presenter.isVideoOn && (
                            <p className="text-sm text-gray-500 mt-2">Camera is off</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Presenter Info */}
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{presenter.name}</span>
                        <Monitor className="w-4 h-4 text-blue-400" />
                        {presenter.isMuted ? (
                          <div className="bg-red-600 rounded-full p-1">
                            <MicOff className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="bg-green-600 rounded-full p-1">
                            <Mic className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute top-4 right-4 h-10 w-10 rounded-full bg-gray-900/80 hover:bg-gray-800/80 border-0"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </Button>
                  </Card>
                </div>
              ) : null;
            })()}

            {/* Participants Sidebar - Right */}
              <div className="w-60 lg:w-72 flex flex-col gap-2 overflow-y-auto">
              {participants.filter(p => !p.isPresenting).slice(0, 3).map((participant) => (
                <Card key={participant.id} className="bg-gray-800 dark:bg-gray-900 rounded-lg overflow-hidden relative aspect-video border-gray-200 dark:border-gray-800 shadow hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all flex-shrink-0">
                  {participant.id === 1 && isVideoOn && (!presenter || presenter.id !== participant.id) ? (
                    // Only attach the video element here if the presenter is NOT the same participant
                    <video
                      autoPlay
                      playsInline
                      muted
                      className="block w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 dark:bg-gray-900">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{participant.name[0]}</span>
                        </div>
                        <p className="text-xs text-gray-300 dark:text-gray-400 px-2 truncate">{participant.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Participant Info Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-medium truncate flex-1">{participant.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {participant.isMuted ? (
                          <div className="bg-red-600 rounded-full p-0.5">
                            <MicOff className="w-2.5 h-2.5 text-white" />
                          </div>
                        ) : (
                          <div className="bg-gray-700/80 rounded-full p-0.5">
                            <Mic className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* More Participants Indicator */}
              {participants.filter(p => !p.isPresenting).length > 3 && (
                <Card className="bg-gray-800 dark:bg-gray-900 rounded-lg overflow-hidden relative aspect-video border-gray-200 dark:border-gray-800 shadow hover:bg-gray-700 dark:hover:bg-gray-800 transition-all cursor-pointer flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-white">
                        +{participants.filter(p => !p.isPresenting).length - 3} more
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
            </div>

            {/* Live Translation Bar */}
            <div className="bg-white dark:bg-gray-900 rounded-xl px-4 md:px-5 py-2.5 md:py-3 shadow-lg border border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-start gap-2 md:gap-3">
                <Languages className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base text-gray-900 dark:text-white break-words">
                    Hello everyone, thank you for joining this session.
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
                      Live
                    </span>
                    <span>ASL to English</span>
                    <span className="hidden sm:inline">95% confidence</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white dark:bg-gray-900 rounded-xl px-3 md:px-4 py-2 md:py-3 shadow-lg border border-gray-200 dark:border-gray-800 gap-2 sm:gap-3 flex-shrink-0">
              {/* Left Side - Meeting Info */}
              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm order-2 sm:order-1">
                <span className="text-gray-600 dark:text-gray-400">12:34</span>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
                <button
                  onClick={handleCopyMeetingId}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors group cursor-pointer"
                >
                  <span>ID: {meetingId}</span>
                  {copied ? (
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 md:w-4 md:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full hidden sm:block" />
                <button
                  onClick={() => setIsConnected(!isConnected)}
                  className="hidden sm:flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`} />
                  <span className="text-xs md:text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </button>
              </div>

              {/* Center - Main Controls */}
              <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
                <Button
                  size="icon"
                  className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all ${
                    isAudioOn 
                      ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200' 
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
                  }`}
                  onClick={() => setIsAudioOn(!isAudioOn)}
                >
                  {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>

                <Button
                  size="icon"
                  className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all ${
                    isVideoOn 
                      ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200' 
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
                  }`}
                  onClick={() => setIsVideoOn(!isVideoOn)}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>

                <Button
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <Hand className="w-4 h-4" />
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

              {/* Right Side - Participants, Chat & More */}
              <div className="flex items-center justify-end gap-1.5 md:gap-2 order-3">
                <Button
                  className={`gap-1.5 h-8 md:h-9 text-xs md:text-sm px-2.5 md:px-3 ${
                    showParticipants 
                      ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => {
                    setShowParticipants(!showParticipants);
                    setShowChat(false);
                  }}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{participants.length}</span>
                </Button>
                <Button
                  size="icon"
                  className={`h-8 w-8 md:h-9 md:w-9 ${
                    showChat 
                      ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => {
                    setShowChat(!showChat);
                    setShowParticipants(false);
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
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
          {(showChat || showParticipants) && (
            <div className="w-full lg:w-80 xl:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg flex flex-col h-full max-h-full overflow-hidden">
              <Tabs defaultValue={showChat ? "chat" : "participants"} className="flex-1 flex flex-col">
                <div className="border-b border-gray-200 dark:border-gray-800 px-4 pt-4">
                  <TabsList className="w-full grid grid-cols-2 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger 
                      value="participants" 
                      className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                      onClick={() => {
                        setShowParticipants(true);
                        setShowChat(false);
                      }}
                    >
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline">Participants ({participants.length})</span>
                      <span className="sm:hidden">{participants.length}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chat" 
                      className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                      onClick={() => {
                        setShowChat(true);
                        setShowParticipants(false);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="participants" className="flex-1 overflow-y-auto p-4 space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{participant.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{participant.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {participant.isPresenting && 'Presenting'}
                          {participant.isMuted && ' • Muted'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-gray-700">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{msg.sender}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{msg.time}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
                      />
                      <Button size="icon" className="rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
