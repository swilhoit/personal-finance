"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTrueRealtimeVoice } from '@/hooks/useTrueRealtimeVoice';

export default function TrueRealtimeVoicePage() {
  const [mounted, setMounted] = useState(false);

  const voiceChat = useTrueRealtimeVoice({
    onTranscript: (text) => {
      console.log('Real-time Transcript:', text);
    },
    onResponse: (text) => {
      console.log('Real-time AI Response:', text);
    }
  });

  useEffect(() => {
    setMounted(true);
    return () => {
      voiceChat.disconnect();
    };
  }, []);

  if (!mounted) return null;

  const handleToggleConversation = () => {
    if (voiceChat.isRecording) {
      voiceChat.stopConversation();
    } else {
      voiceChat.startConversation();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b-4 border-green-500 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-green-600 hover:scale-110 transition-transform"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m0 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-dm-mono font-black text-green-600">
                🚀 TRUE REALTIME VOICE CHAT
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                voiceChat.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-dm-mono font-medium text-slate-600">
                {voiceChat.isConnected ? 'CONNECTED TO OPENAI' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Connection Control */}
        {!voiceChat.isConnected && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 mb-8 border-4 border-blue-500/20 shadow-2xl text-center">
            <h2 className="text-xl font-dm-mono font-black text-blue-600 mb-4">
              🔗 CONNECT TO OPENAI REALTIME API
            </h2>
            <button
              onClick={voiceChat.connect}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-dm-mono font-bold text-lg hover:scale-105 transition-all shadow-2xl"
            >
              Connect to WebSocket
            </button>
            <p className="text-sm text-slate-600 mt-4">
              This connects directly to OpenAI&apos;s Realtime API for instant voice chat
            </p>
          </div>
        )}

        {/* AI Avatar & Voice Interface */}
        {voiceChat.isConnected && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 mb-8 border-4 border-green-500/20 shadow-2xl">
            <div className="text-center space-y-6">
              {/* AI Avatar - Circular Video */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto mb-6">
                {/* Animated background based on voice state */}
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 transition-all duration-300 ${
                  voiceChat.isPlaying ? 'bg-green-400 animate-pulse scale-110' :
                  voiceChat.isListening ? 'bg-blue-400 animate-pulse scale-105' :
                  voiceChat.isRecording ? 'bg-red-400 animate-pulse scale-110' : 
                  'bg-yellow-400 animate-pulse'
                }`}></div>
                
                {/* Video container */}
                <div className={`relative w-full h-full rounded-full overflow-hidden shadow-2xl transition-all duration-300 ${
                  voiceChat.isPlaying ? 'border-4 border-green-500/70 scale-105' :
                  voiceChat.isListening ? 'border-4 border-blue-500/70 scale-102' :
                  voiceChat.isRecording ? 'border-4 border-red-500/70 scale-105' : 
                  'border-4 border-cyan-400/50'
                }`}>
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-[200%] h-[200%] object-cover translate-x-0 -translate-y-[25%]"
                  >
                    <source src="/hero-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Voice state overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    voiceChat.isRecording || voiceChat.isListening || voiceChat.isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="text-4xl">
                      {voiceChat.isPlaying ? '🔊' :
                       voiceChat.isListening ? '👂' :
                       voiceChat.isRecording ? '🎤' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-sm font-dm-mono font-bold text-green-600 mb-4">
                {voiceChat.isPlaying ? '🔊 MAMA IS SPEAKING (LIVE AUDIO)...' :
                 voiceChat.isListening ? '👂 MAMA IS LISTENING...' :
                 voiceChat.isRecording ? '🎤 RECORDING (PRESS & HOLD)...' : 
                 '⚡ READY FOR INSTANT CONVERSATION WITH MAMA'}
              </div>

              {/* Voice Button */}
              <button
                onClick={handleToggleConversation}
                onMouseDown={() => !voiceChat.isRecording && voiceChat.startConversation()}
                onMouseUp={() => voiceChat.isRecording && voiceChat.stopConversation()}
                onTouchStart={() => !voiceChat.isRecording && voiceChat.startConversation()}
                onTouchEnd={() => voiceChat.isRecording && voiceChat.stopConversation()}
                disabled={voiceChat.isPlaying}
                className={`px-8 py-4 rounded-2xl font-dm-mono font-bold text-lg transition-all duration-150 select-none ${
                  voiceChat.isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50 scale-105' 
                    : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:scale-105 shadow-lg shadow-green-500/30'
                } ${voiceChat.isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                aria-label="Press and hold to talk"
              >
                {voiceChat.isRecording ? '🛑 STOP TALKING' : '🎤 START TALKING'}
              </button>

              {/* Instructions */}
              <div className="text-base font-dm-mono font-medium text-slate-600 max-w-md mx-auto">
                {voiceChat.isPlaying ? 'MAMA is responding with live audio streaming...' :
                 voiceChat.isListening ? 'Keep talking! MAMA will detect when you stop...' :
                 voiceChat.isRecording ? 'Speak naturally - MAMA will auto-detect speech!' : 
                 'Press & hold to start talking to MAMA - release when done'}
              </div>

              {/* Error Display */}
              {voiceChat.error && (
                <div className="p-4 bg-red-100 rounded-2xl border-2 border-red-300">
                  <div className="text-sm font-dm-mono font-bold text-red-700">
                    ⚠️ {voiceChat.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Conversation */}
        {voiceChat.isConnected && (
          <div className="space-y-6">
            {/* User Transcript - Live Updates */}
            {voiceChat.transcript && (
              <div className="bg-blue-500/10 rounded-2xl p-6 border-l-4 border-blue-500">
                <div className="text-xs font-dm-mono font-bold text-blue-600 mb-2">
                  YOU (LIVE TRANSCRIPT):
                </div>
                <div className="text-lg font-dm-mono font-medium text-slate-700">
                  &ldquo;{voiceChat.transcript}&rdquo;
                </div>
              </div>
            )}

            {/* AI Response - Streams Live */}
            {voiceChat.aiResponse && (
              <div className="bg-green-500/10 rounded-2xl p-6 border-l-4 border-green-500">
                <div className="text-xs font-dm-mono font-bold text-green-600 mb-2 flex items-center gap-2">
                  MAMA (LIVE AUDIO + TEXT):
                  {voiceChat.isPlaying && (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
                <div className="text-lg font-dm-mono font-medium text-slate-700">
                  {voiceChat.aiResponse}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}