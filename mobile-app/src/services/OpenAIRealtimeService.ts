import { Audio } from 'expo-av';
import { EventEmitter } from 'events';

interface RealtimeConfig {
  apiKey: string;
  voice?: 'alloy' | 'echo' | 'shimmer';
  model?: string;
  instructions?: string;
}

interface AudioChunk {
  audio: Int16Array;
  timestamp: number;
}

class OpenAIRealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private voice: string;
  private isConnected: boolean = false;
  private audioQueue: AudioChunk[] = [];
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private sessionId: string | null = null;
  private conversationId: string | null = null;

  constructor(config: RealtimeConfig) {
    super();
    this.apiKey = config.apiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    this.voice = config.voice || 'alloy';
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // OpenAI Realtime API WebSocket endpoint
        this.ws = new WebSocket('wss://api.openai.com/v1/realtime', [], {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'OpenAI-Beta': 'realtime=v1',
          }
        });

        this.ws.onopen = () => {
          console.log('Connected to OpenAI Realtime API');
          this.isConnected = true;
          this.emit('connected');
          
          // Send initial session configuration
          this.sendMessage({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: `You are a helpful AI financial advisor. You help users understand their spending, 
                           manage budgets, and make better financial decisions. Be conversational and friendly.
                           Keep responses concise for voice interaction.`,
              voice: this.voice,
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
              tools: [
                {
                  type: 'function',
                  name: 'get_spending_summary',
                  description: 'Get user spending summary',
                  parameters: {
                    type: 'object',
                    properties: {
                      period: {
                        type: 'string',
                        enum: ['week', 'month', 'year']
                      }
                    }
                  }
                },
                {
                  type: 'function',
                  name: 'get_budget_status',
                  description: 'Get current budget status',
                  parameters: {
                    type: 'object',
                    properties: {}
                  }
                }
              ]
            }
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from OpenAI Realtime API');
          this.isConnected = false;
          this.emit('disconnected');
        };

      } catch (error) {
        console.error('Connection error:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    console.log('Received message:', message.type);

    switch (message.type) {
      case 'session.created':
        this.sessionId = message.session.id;
        this.emit('session.created', message.session);
        break;

      case 'conversation.created':
        this.conversationId = message.conversation.id;
        break;

      case 'response.audio.delta':
        // Handle incoming audio chunks
        if (message.delta) {
          this.handleAudioDelta(message.delta);
        }
        break;

      case 'response.audio.transcript.delta':
        // Handle transcript updates
        this.emit('transcript', {
          role: 'assistant',
          text: message.delta,
          final: false
        });
        break;

      case 'response.audio.transcript.done':
        // Final transcript
        this.emit('transcript', {
          role: 'assistant',
          text: message.transcript,
          final: true
        });
        break;

      case 'input_audio_buffer.speech_started':
        this.emit('speech.started');
        break;

      case 'input_audio_buffer.speech_stopped':
        this.emit('speech.stopped');
        break;

      case 'response.done':
        this.emit('response.complete');
        break;

      case 'error':
        console.error('API Error:', message.error);
        this.emit('error', message.error);
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  private async handleAudioDelta(audioData: string) {
    try {
      // Convert base64 audio to playable format
      const audioBuffer = this.base64ToArrayBuffer(audioData);
      
      // Queue audio for playback
      this.audioQueue.push({
        audio: new Int16Array(audioBuffer),
        timestamp: Date.now()
      });

      // Process audio queue
      await this.processAudioQueue();
    } catch (error) {
      console.error('Error handling audio delta:', error);
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async processAudioQueue() {
    // In a production app, you'd implement proper audio buffering and playback
    // For now, we'll emit the audio data for the UI to handle
    if (this.audioQueue.length > 0) {
      const chunk = this.audioQueue.shift();
      if (chunk) {
        this.emit('audio.chunk', chunk);
      }
    }
  }

  async startRecording(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });

      // Set up recording callback to stream audio
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering) {
          // Stream audio data to WebSocket
          this.streamAudioChunk(status);
        }
      });

      await recording.startAsync();
      this.recording = recording;
      this.emit('recording.started');
      
      // Start streaming audio
      this.startAudioStreaming();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.emit('error', error);
    }
  }

  private async startAudioStreaming() {
    // In a real implementation, you'd stream PCM16 audio chunks directly
    // For now, we'll simulate with periodic updates
    const streamInterval = setInterval(async () => {
      if (!this.recording) {
        clearInterval(streamInterval);
        return;
      }

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          // In production, you'd get the actual audio buffer here
          // and send it via WebSocket
          this.sendMessage({
            type: 'input_audio_buffer.append',
            audio: '' // Base64 encoded PCM16 audio would go here
          });
        }
      } catch (error) {
        console.error('Error streaming audio:', error);
      }
    }, 100); // Stream every 100ms
  }

  private streamAudioChunk(status: any) {
    // This would contain the actual audio streaming logic
    // Converting the recording buffer to PCM16 and sending via WebSocket
  }

  async stopRecording(): Promise<void> {
    if (!this.recording) return;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.emit('recording.stopped');

      // Send commit message to process the audio
      this.sendMessage({
        type: 'input_audio_buffer.commit'
      });

      // Create a response
      this.sendMessage({
        type: 'response.create'
      });

    } catch (error) {
      console.error('Error stopping recording:', error);
      this.emit('error', error);
    }
  }

  sendTextMessage(text: string) {
    if (!this.isConnected) {
      console.error('Not connected to Realtime API');
      return;
    }

    this.sendMessage({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    });

    // Create a response
    this.sendMessage({
      type: 'response.create'
    });
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.recording) {
      this.recording.stopAndUnloadAsync();
      this.recording = null;
    }
    if (this.sound) {
      this.sound.unloadAsync();
      this.sound = null;
    }
  }

  isActive(): boolean {
    return this.isConnected;
  }
}

export default OpenAIRealtimeService;