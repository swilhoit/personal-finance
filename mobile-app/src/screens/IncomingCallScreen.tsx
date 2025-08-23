import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ImageBackground,
  BlurView,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface IncomingCallScreenProps {
  callerName?: string;
  callerNumber?: string;
  callerImage?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
  onRemind?: () => void;
}

export default function IncomingCallScreen({
  callerName = 'Financial Advisor',
  callerNumber = 'AI Assistant',
  callerImage,
  onAccept,
  onDecline,
  onMessage,
  onRemind,
}: IncomingCallScreenProps) {
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const acceptButtonScale = useRef(new Animated.Value(1)).current;
  const declineButtonScale = useRef(new Animated.Value(1)).current;

  // Animation for caller photo pulsing
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

  // Entrance animation
  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Play ringtone
  const playRingtone = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/ringtone.mp3'), // You'll need to add a ringtone file
        { isLooping: true, shouldPlay: true }
      );
      setSound(sound);
    } catch (error) {
      console.log('Error playing ringtone:', error);
    }
  };

  // Haptic feedback pattern
  const startHapticPattern = () => {
    const pattern = [1000, 2000]; // Vibrate for 1s, pause for 2s
    Vibration.vibrate(pattern, true);
  };

  useEffect(() => {
    // Set status bar for full-screen experience
    StatusBar.setBarStyle('light-content');
    
    // Start animations and effects
    startPulseAnimation();
    startEntranceAnimation();
    startHapticPattern();
    // playRingtone(); // Uncomment when you add a ringtone file

    // Initial haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    return () => {
      // Cleanup
      Vibration.cancel();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(acceptButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(acceptButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Vibration.cancel();
      if (sound) sound.stopAsync();
      onAccept?.();
    });
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(declineButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(declineButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Vibration.cancel();
      if (sound) sound.stopAsync();
      onDecline?.();
    });
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMessage?.();
  };

  const handleRemind = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemind?.();
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Background with blur effect */}
      <ImageBackground
        source={callerImage ? { uri: callerImage } : require('../../assets/gradient-bg.png')}
        style={StyleSheet.absoluteFillObject}
        blurRadius={30}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Top Section */}
        <View style={[styles.topSection, { paddingTop: insets.top + 20 }]}>
          {/* Call Type */}
          <View style={styles.callTypeContainer}>
            <Ionicons name="videocam" size={20} color="#fff" />
            <Text style={styles.callTypeText}>FaceTime Video</Text>
          </View>

          {/* Caller Photo */}
          <Animated.View
            style={[
              styles.callerPhotoContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {callerImage ? (
              <ImageBackground
                source={{ uri: callerImage }}
                style={styles.callerPhoto}
                imageStyle={styles.callerPhotoImage}
              />
            ) : (
              <View style={[styles.callerPhoto, styles.placeholderPhoto]}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            )}
          </Animated.View>

          {/* Caller Info */}
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerNumber}>{callerNumber}</Text>
          <Text style={styles.callingStatus}>calling...</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleRemind}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="alarm" size={22} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Remind Me</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleMessage}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="chatbubble" size={22} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 30 }]}>
          <View style={styles.actionButtons}>
            {/* Decline Button */}
            <Animated.View
              style={{
                transform: [{ scale: declineButtonScale }],
              }}
            >
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleDecline}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={35} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            {/* Accept Button */}
            <Animated.View
              style={{
                transform: [{ scale: acceptButtonScale }],
              }}
            >
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam" size={35} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Text style={styles.swipeHint}>Swipe up for more options</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 40,
  },
  callTypeText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  callerPhotoContainer: {
    marginBottom: 30,
  },
  callerPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  callerPhotoImage: {
    borderRadius: 70,
  },
  placeholderPhoto: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  callerName: {
    fontSize: 34,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  callerNumber: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  callingStatus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 60,
  },
  quickAction: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSection: {
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: 20,
  },
  actionButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  swipeHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
});