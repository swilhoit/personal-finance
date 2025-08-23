import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface CallConfig {
  callerName: string;
  callerNumber?: string;
  callerImage?: string;
  callType?: 'video' | 'audio';
  onAnswer?: () => void;
  onDecline?: () => void;
}

class CallService {
  private static instance: CallService;
  private ringtoneSound: Audio.Sound | null = null;
  private isRinging: boolean = false;
  private callConfig: CallConfig | null = null;

  private constructor() {
    this.setupAudio();
  }

  static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  private async setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }

  async startIncomingCall(config: CallConfig): Promise<void> {
    this.callConfig = config;
    this.isRinging = true;

    // Play ringtone
    await this.playRingtone();

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  private async playRingtone(): Promise<void> {
    try {
      // For now, we'll use a system sound
      // In production, you'd load a custom ringtone file
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
        { 
          isLooping: true, 
          shouldPlay: true,
          volume: 0.8,
        }
      );
      this.ringtoneSound = sound;
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  }

  async stopRinging(): Promise<void> {
    this.isRinging = false;
    
    if (this.ringtoneSound) {
      try {
        await this.ringtoneSound.stopAsync();
        await this.ringtoneSound.unloadAsync();
        this.ringtoneSound = null;
      } catch (error) {
        console.error('Error stopping ringtone:', error);
      }
    }
  }

  async answerCall(): Promise<void> {
    await this.stopRinging();
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Call the onAnswer callback if provided
    this.callConfig?.onAnswer?.();
    
    // Reset call config
    this.callConfig = null;
  }

  async declineCall(): Promise<void> {
    await this.stopRinging();
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Call the onDecline callback if provided
    this.callConfig?.onDecline?.();
    
    // Reset call config
    this.callConfig = null;
  }

  getCallConfig(): CallConfig | null {
    return this.callConfig;
  }

  isCallActive(): boolean {
    return this.isRinging;
  }
}

export default CallService.getInstance();