import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface CallConfig {
  callerName: string;
  callerNumber?: string;
  callerImage?: string;
  callerAvatar?: string;
  chaosLevel?: number;
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
      // Skip playing ringtone for now to avoid crash
      // In production, you'd load a custom ringtone file bundled with the app
      console.log('Ringtone would play here');
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