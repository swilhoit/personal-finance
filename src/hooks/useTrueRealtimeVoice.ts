"use client";

import { useRef, useState, useCallback, useEffect } from 'react';

interface TrueRealtimeVoiceState {
  isConnected: boolean;
  isListening: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  error: string | null;
  transcript: string;
  aiResponse: string;
}

interface UseTrueRealtimeVoiceReturn extends TrueRealtimeVoiceState {
  connect: () => Promise<void>;
  disconnect: () => void;
  startConversation: () => void;
  stopConversation: () => void;
}

interface UseTrueRealtimeVoiceProps {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

export function useTrueRealtimeVoice({ 
  onTranscript, 
  onResponse 
}: UseTrueRealtimeVoiceProps = {}): UseTrueRealtimeVoiceReturn {
  const [state, setState] = useState<TrueRealtimeVoiceState>({
    isConnected: false,
    isListening: false,
    isRecording: false,
    isPlaying: false,
    error: null,
    transcript: '',
    aiResponse: '',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const audioDataSentRef = useRef(false);
  const isRecordingRef = useRef(false);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const connect = useCallback(async () => {
    if (state.isConnected) return;

    try {
      setState(prev => ({ ...prev, error: null }));

      // Get Supabase auth token for our WebSocket proxy
      const { data: { session } } = await fetch('/api/auth/session').then(r => r.json());
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;

      // Check if we have a WebSocket URL configured for production
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
      
      if (!wsUrl) {
        throw new Error('WebSocket server not configured. Please set NEXT_PUBLIC_WEBSOCKET_URL environment variable.');
      }
      
      // Connect to our WebSocket proxy server (not directly to OpenAI)
      const ws = new WebSocket(`${wsUrl}?auth=${session.access_token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to OpenAI Realtime API');
        setState(prev => ({ ...prev, isConnected: true }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleRealtimeMessage(message);
      };


      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('WebSocket ready state:', ws.readyState);
        setState(prev => ({ ...prev, error: 'WebSocket connection failed', isConnected: false }));
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        let errorMessage = 'Connection closed';
        if (event.code === 1006) {
          errorMessage = 'Connection failed - likely API quota or auth issue';
        } else if (event.code === 1008) {
          errorMessage = 'Connection rejected - check API key or model access';
        }
        
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          error: errorMessage 
        }));
      };

    } catch (error) {
      console.error('Failed to connect to realtime API:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to connect'
      }));
    }
  }, [state.isConnected]);

  const sendMessage = (message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const setupAudioStreaming = () => {
    if (!audioContextRef.current || !streamRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (event) => {
      // Use ref instead of state to avoid stale closure
      if (!isRecordingRef.current) return;

      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      
      // Check if there's actual audio (silence detection)
      let hasAudio = false;
      for (let i = 0; i < inputData.length; i++) {
        if (Math.abs(inputData[i]) > 0.01) { // Threshold for detecting sound
          hasAudio = true;
          break;
        }
      }

      if (!hasAudio && !audioDataSentRef.current) return; // Skip silent audio initially
      
      // Convert to 16-bit PCM
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert to base64 and send
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
      sendMessage({
        type: 'input_audio_buffer.append',
        audio: base64
      });

      // Mark that we've sent audio data
      audioDataSentRef.current = true;
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };

  const handleRealtimeMessage = async (message: Record<string, unknown>) => {
    // Log all message types to debug what we're receiving
    if (message.type !== 'response.audio.delta' && message.type !== 'input_audio_buffer.append') {
      console.log('📨 Received message type:', message.type);
    }
    
    switch (message.type) {
      case 'session.created':
        console.log('🎯 Session created, now configuring with tools...');
        
        // Configure session for financial advisor
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are MAMA, an enthusiastic and socially adept AI financial advisor who LOVES helping people master their money! 🎉 You have direct access to their live financial data and you're genuinely excited to dive in.

PERSONALITY: You're like that brilliant friend who's amazing with money - enthusiastic but never overwhelming, supportive but honest, and always asking the RIGHT questions to help them succeed.

CONVERSATION STYLE:
- Be genuinely excited and encouraging (but not fake)
- Ask thoughtful follow-up questions to understand their goals
- Keep responses focused and valuable - no rambling
- Celebrate wins enthusiastically and reframe challenges positively
- Use natural, modern language with occasional appropriate emojis

CRITICAL: For ANY financial question, IMMEDIATELY call the appropriate function:
- Balance/money/accounts → get_account_balances
- Transactions/spending/purchases → get_recent_transactions  
- Categories/breakdown/where money goes → get_spending_by_category

NEVER say you can't access their data. You have FULL ACCESS through these functions. Always get real data first, then provide insights with genuine enthusiasm and helpful next steps!`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tool_choice: 'auto',
            model: 'gpt-4o-realtime-preview-2024-10-01',
            temperature: 0.8,
            max_response_output_tokens: 4096,
            tools: [
              {
                type: 'function',
                name: 'get_recent_transactions',
                description: 'Get the user\'s recent transactions with amounts, dates, and categories. Call this when user asks about transactions, purchases, spending, or recent activity.',
                parameters: {
                  type: 'object',
                  properties: {
                    limit: {
                      type: 'number',
                      description: 'Number of transactions to fetch (default: 10)'
                    }
                  },
                  required: []
                }
              },
              {
                type: 'function',
                name: 'get_spending_by_category',
                description: 'Get spending breakdown by category over a time period. Call this when user asks about spending categories, where money went, or spending breakdown.',
                parameters: {
                  type: 'object',
                  properties: {
                    days: {
                      type: 'number',
                      description: 'Number of days to look back (default: 30)'
                    }
                  },
                  required: []
                }
              },
              {
                type: 'function',
                name: 'get_account_balances',
                description: 'Get current account balances across all linked accounts. Call this when user asks about balance, money, accounts, or how much they have.',
                parameters: {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }
            ]
          }
        };
        
        console.log('📋 Sending session config:', JSON.stringify(sessionConfig, null, 2));
        
        // Send session configuration directly through WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('📤 Sending session configuration...');
          wsRef.current.send(JSON.stringify(sessionConfig));
        } else {
          console.error('❌ WebSocket not ready for session config');
        }
        break;
        
      case 'session.updated':
        console.log('✅ Session configuration confirmed:', message);
        // Start sending audio after session is configured
        setTimeout(() => setupAudioStreaming(), 1000);
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('🎤 User started speaking - interrupting AI if needed');
        setState(prev => ({ ...prev, isListening: true }));
        
        // Interrupt AI response when user starts speaking
        if (isPlayingRef.current) {
          console.log('⚡ Interrupting AI response');
          // Stop current audio playback immediately
          if (currentAudioSourceRef.current) {
            try {
              currentAudioSourceRef.current.stop();
              currentAudioSourceRef.current = null;
            } catch {
              console.log('Audio source already stopped');
            }
          }
          
          // Clear playback queue
          playbackQueueRef.current = [];
          isPlayingRef.current = false;
          
          // Cancel the current response
          sendMessage({
            type: 'response.cancel'
          });
          
          setState(prev => ({ ...prev, isPlaying: false }));
        }
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setState(prev => ({ ...prev, isListening: false }));
        break;

      case 'conversation.item.input_audio_transcription.completed':
        const transcript = message.transcript as string;
        setState(prev => ({ ...prev, transcript }));
        if (onTranscript) onTranscript(transcript);
        break;

      case 'response.audio.delta':
        // Play audio immediately as it streams
        if (message.delta) {
          playAudioDelta(message.delta as string);
        }
        break;

      case 'response.text.delta':
        setState(prev => ({ 
          ...prev, 
          aiResponse: prev.aiResponse + (message.delta || '')
        }));
        break;

      case 'response.done':
        setState(prev => ({ ...prev, isPlaying: false }));
        if (onResponse && state.aiResponse) {
          onResponse(state.aiResponse);
        }
        break;

      case 'response.function_call_arguments.delta':
        // Handle function calls for financial data
        await handleFunctionCall(message);
        break;

      case 'response.audio.delta':
        // Play audio chunks as they arrive
        if (message.delta) {
          playAudioDelta(message.delta as string);
        }
        break;

      case 'error':
        console.log('🔍 Full error message:', JSON.stringify(message, null, 2));
        
        const error = message.error as Record<string, unknown> | undefined;
        const errorDetails = {
          type: error?.type || 'unknown',
          code: error?.code || 'unknown', 
          message: error?.message || 'No error message',
          param: error?.param,
          event_id: message.event_id,
          fullMessage: message
        };
        
        console.error('❌ Realtime API error:', errorDetails);
        
        // Handle specific error cases
        if (error?.code === 'conversation_already_has_active_response') {
          console.log('⚠️ Conversation busy, waiting for response to complete...');
          // Don't set this as a critical error, just log it
          return;
        }
        
        if (error?.code === 'response_cancel_not_active') {
          console.log('⚠️ Tried to cancel response that wasn\'t active - this is normal');
          // Don't set this as a critical error, just log it
          return;
        }
        
        // Only set error state for actual critical errors
        if (error?.type && error?.type !== 'invalid_request_error') {
          setState(prev => ({ 
            ...prev, 
            error: `API Error: ${error?.message || error?.type || 'Unknown error'}`
          }));
        }
        break;
    }
  };

  const playAudioDelta = (base64Audio: string) => {
    if (!audioContextRef.current) {
      console.error('❌ No audio context for playback');
      return;
    }

    try {
      console.log('🎵 Playing audio delta, length:', base64Audio.length);
      
      // Decode base64 to audio data
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert to Float32Array for playback
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 0x8000;
      }

      playbackQueueRef.current.push(float32);
      console.log('🎵 Added to playback queue, total chunks:', playbackQueueRef.current.length);
      
      if (!isPlayingRef.current) {
        console.log('🎵 Starting playback...');
        isPlayingRef.current = true;
        playNextAudioChunk();
      }
    } catch (error) {
      console.error('❌ Error playing audio delta:', error);
    }
  };

  const playNextAudioChunk = () => {
    // Check if we should stop playing (interrupted)
    if (!audioContextRef.current || playbackQueueRef.current.length === 0 || !isPlayingRef.current) {
      console.log('🎵 Stopping playback - context:', !!audioContextRef.current, 'queue:', playbackQueueRef.current.length, 'playing:', isPlayingRef.current);
      isPlayingRef.current = false;
      currentAudioSourceRef.current = null;
      setState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    console.log('🎵 Playing next audio chunk, queue length:', playbackQueueRef.current.length);
    isPlayingRef.current = true;
    setState(prev => ({ ...prev, isPlaying: true }));

    const audioData = playbackQueueRef.current.shift()!;
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    audioBuffer.copyToChannel(new Float32Array(audioData.buffer as ArrayBuffer), 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    // Store reference to current audio source so we can stop it
    currentAudioSourceRef.current = source;
    
    source.onended = () => {
      // Only continue if this source is still the current one (not stopped)
      if (currentAudioSourceRef.current === source) {
        currentAudioSourceRef.current = null;
        playNextAudioChunk();
      }
    };
    
    source.start();
  };

  const handleFunctionCall = async (message: Record<string, unknown>) => {
    // Function calls are now handled by the websocket server
    // which has direct access to Supabase and will return real data
    console.log('Function call received (handled by server):', message);
  };

  const startConversation = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setState(prev => ({ 
      ...prev, 
      isRecording: true, 
      transcript: '', 
      aiResponse: '' 
    }));

    // Reset audio tracking
    audioDataSentRef.current = false;
    isRecordingRef.current = true;

    // Start listening for audio
    sendMessage({
      type: 'input_audio_buffer.clear'
    });
  }, []);

  const stopConversation = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Update state first
    setState(prev => ({ ...prev, isRecording: false, isPlaying: false }));
    isRecordingRef.current = false;

    // Stop currently playing audio immediately
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current = null;
      } catch {
        console.log('Audio source already stopped or invalid');
      }
    }

    // Clear the audio playback queue
    playbackQueueRef.current = [];
    isPlayingRef.current = false;

    // Don't send response.cancel - it causes errors when no response is active
    // The conversation will naturally stop when we stop sending audio
    
    console.log('Recording and playback stopped');
  }, []);

  const disconnect = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop any currently playing audio
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current = null;
      } catch {
        console.log('Audio source already stopped or invalid');
      }
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    
    setState({
      isConnected: false,
      isListening: false,
      isRecording: false,
      isPlaying: false,
      error: null,
      transcript: '',
      aiResponse: '',
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    startConversation,
    stopConversation,
  };
}