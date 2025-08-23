import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import OpenAIRealtimeService from '../services/OpenAIRealtimeService';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

interface VoiceCallScreenProps {
  navigation?: any;
  route?: any;
}

interface TranscriptMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function VoiceCallScreen({ navigation, route }: VoiceCallScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  
  // Service ref
  const realtimeService = useRef<OpenAIRealtimeService | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setConnectionStatus('Connecting to AI assistant...');
      
      // Initialize OpenAI Realtime Service
      realtimeService.current = new OpenAIRealtimeService({
        apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
        voice: 'alloy',
        instructions: `You are a friendly AI financial advisor having a voice conversation. 
                      Keep responses conversational and concise. 
                      Help the user understand their finances.`
      });

      // Set up event listeners
      setupEventListeners();

      // Connect to the service
      await realtimeService.current.connect();
      
      // Start the call
      startCall();
      
    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert('Connection Error', 'Failed to connect to AI assistant');
      navigation?.goBack();
    }
  };

  const setupEventListeners = () => {
    if (!realtimeService.current) return;

    realtimeService.current.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Send initial greeting
      setTimeout(() => {
        realtimeService.current?.sendTextMessage(
          "Hello! I'm your AI financial advisor. How can I help you today?"
        );
      }, 1000);
    });

    realtimeService.current.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    });

    realtimeService.current.on('transcript', (data: any) => {
      const newMessage: TranscriptMessage = {
        role: data.role,
        text: data.text,
        timestamp: new Date()
      };
      
      if (data.final) {
        setTranscript(prev => [...prev, newMessage]);
      } else {
        // Update the last message if it's being built
        setTranscript(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === data.role) {
            updated[updated.length - 1].text = data.text;
          } else {
            updated.push(newMessage);
          }
          return updated;
        });
      }
    });

    realtimeService.current.on('speech.started', () => {
      setIsAISpeaking(false);
      startWaveAnimation();
    });

    realtimeService.current.on('speech.stopped', () => {
      stopWaveAnimation();
    });

    realtimeService.current.on('response.complete', () => {
      setIsAISpeaking(false);
    });

    realtimeService.current.on('audio.chunk', () => {
      setIsAISpeaking(true);
      startPulseAnimation();
    });

    realtimeService.current.on('recording.started', () => {
      setIsRecording(true);
      startWaveAnimation();
    });

    realtimeService.current.on('recording.stopped', () => {
      setIsRecording(false);
      stopWaveAnimation();
    });
  };

  const startCall = () => {
    // Start call duration timer
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    startPulseAnimation();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    // Animate voice waves
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(waveAnim1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim1, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(waveAnim3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim3, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  const stopWaveAnimation = () => {
    waveAnim1.setValue(0);
    waveAnim2.setValue(0);
    waveAnim3.setValue(0);
  };

  const toggleRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isRecording) {
      await realtimeService.current?.stopRecording();
    } else {
      await realtimeService.current?.startRecording();
    }
  };

  const toggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
    // In production, you'd actually mute the microphone here
  };

  const toggleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeakerOn(!isSpeakerOn);
    // In production, you'd switch audio output here
  };

  const endCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'End Call',
      'Are you sure you want to end the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: () => {
            cleanup();
            navigation?.goBack();
          }
        }
      ]
    );
  };

  const cleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    if (realtimeService.current) {
      realtimeService.current.disconnect();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const askFinancialQuestion = (question: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    realtimeService.current?.sendTextMessage(question);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1f2937', '#111827', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.callTitle}>AI Financial Advisor</Text>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
        <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <Animated.View
          style={[
            styles.avatarContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.avatar}
          >
            <Ionicons name="mic" size={50} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Voice Waves */}
        <View style={styles.waveContainer}>
          <Animated.View
            style={[
              styles.wave,
              {
                opacity: waveAnim1,
                transform: [{ scaleY: waveAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.5]
                })}]
              }
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.waveMiddle,
              {
                opacity: waveAnim2,
                transform: [{ scaleY: waveAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 2]
                })}]
              }
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              {
                opacity: waveAnim3,
                transform: [{ scaleY: waveAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.5]
                })}]
              }
            ]}
          />
        </View>

        <Text style={styles.speakingIndicator}>
          {isRecording ? 'Listening...' : isAISpeaking ? 'AI Speaking...' : 'Ready'}
        </Text>
      </View>

      {/* Quick Questions */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quickQuestions}
        contentContainerStyle={styles.quickQuestionsContent}
      >
        <TouchableOpacity 
          style={styles.quickQuestion}
          onPress={() => askFinancialQuestion("What's my spending this month?")}
        >
          <Text style={styles.quickQuestionText}>Monthly Spending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickQuestion}
          onPress={() => askFinancialQuestion("How are my budgets doing?")}
        >
          <Text style={styles.quickQuestionText}>Budget Status</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickQuestion}
          onPress={() => askFinancialQuestion("Any financial tips for me?")}
        >
          <Text style={styles.quickQuestionText}>Financial Tips</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickQuestion}
          onPress={() => askFinancialQuestion("What are my top expenses?")}
        >
          <Text style={styles.quickQuestionText}>Top Expenses</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Transcript */}
      <ScrollView style={styles.transcriptContainer}>
        {transcript.map((message, index) => (
          <View key={index} style={[
            styles.transcriptMessage,
            message.role === 'user' ? styles.userMessage : styles.assistantMessage
          ]}>
            <Text style={styles.transcriptRole}>
              {message.role === 'user' ? 'You' : 'AI Advisor'}
            </Text>
            <Text style={styles.transcriptText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.secondaryControls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons 
              name={isMuted ? "mic-off" : "mic"} 
              size={24} 
              color={isMuted ? "#ef4444" : "#fff"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons 
              name={isSpeakerOn ? "volume-high" : "volume-mute"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.mainControls}>
          <TouchableOpacity
            style={[styles.talkButton, isRecording && styles.talkButtonActive]}
            onPress={toggleRecording}
            disabled={!isConnected}
          >
            <Ionicons 
              name={isRecording ? "mic" : "mic-outline"} 
              size={40} 
              color="#fff" 
            />
            <Text style={styles.talkButtonText}>
              {isRecording ? 'Release to Send' : 'Hold to Talk'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endCallButton}
            onPress={endCall}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  callTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  connectionStatus: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 4,
  },
  duration: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'monospace',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginBottom: 20,
  },
  wave: {
    width: 4,
    height: 30,
    backgroundColor: '#10b981',
    marginHorizontal: 3,
    borderRadius: 2,
  },
  waveMiddle: {
    height: 40,
  },
  speakingIndicator: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '500',
  },
  quickQuestions: {
    maxHeight: 50,
    marginVertical: 20,
  },
  quickQuestionsContent: {
    paddingHorizontal: 20,
  },
  quickQuestion: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  quickQuestionText: {
    color: '#fff',
    fontSize: 14,
  },
  transcriptContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transcriptMessage: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  transcriptRole: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '80%',
  },
  controls: {
    paddingHorizontal: 20,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  talkButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginRight: 20,
  },
  talkButtonActive: {
    backgroundColor: '#059669',
  },
  talkButtonText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});