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
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChaos } from '../components/ChaosProvider';
import { RetroTheme, ChaosLevels } from '../theme/retroTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface IncomingCallScreenProps {
  callerName?: string;
  callerNumber?: string;
  callerImage?: string;
  callerAvatar?: string;
  chaosLevel?: number;
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
  onRemind?: () => void;
}

export default function IncomingCallScreen({
  callerName = 'MAMA AI',
  callerNumber = '666-CHAOS-666',
  callerImage,
  callerAvatar = '👹',
  chaosLevel = 5,
  onAccept,
  onDecline,
  onMessage,
  onRemind,
}: IncomingCallScreenProps) {
  const insets = useSafeAreaInsets();
  const { triggerChaos, triggerExplosion, playRetroSound, setStrobeMode } = useChaos();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentEmoji, setCurrentEmoji] = useState(callerAvatar);
  const [isStrobing, setIsStrobing] = useState(true);
  const [backgroundColorIndex, setBackgroundColorIndex] = useState(0);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const acceptButtonScale = useRef(new Animated.Value(1)).current;
  const declineButtonScale = useRef(new Animated.Value(1)).current;
  const strobeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(1)).current;
  const emojiRotate = useRef(new Animated.Value(0)).current;
  
  const CHAOS_EMOJIS = ['👹', '🔥', '💀', '👾', '🎮', '😈', '👺', '🤖', '👽', '💥', '⚡', '🌟'];
  const STROBE_COLORS = ['#FF0000', '#FF00FF', '#00FFFF', '#FFFF00', '#00FF00', '#FF69B4', '#FFA500', '#FF1493'];

  // MAXIMUM CHAOS ANIMATIONS
  const startChaosAnimations = () => {
    // Intense pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 200,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 200,
          easing: Easing.elastic(2),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Strobe effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(strobeAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(strobeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: false,
        }),
      ])
    ).start();
    
    // Screen shake
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 20,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -20,
          duration: 50,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Rotation chaos
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 360,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Glitch effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(Math.random() * 500),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(Math.random() * 1000),
      ])
    ).start();
    
    // Emoji animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.spring(emojiScale, {
            toValue: 2,
            friction: 2,
            tension: 160,
            useNativeDriver: true,
          }),
          Animated.spring(emojiScale, {
            toValue: 1,
            friction: 2,
            tension: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(emojiRotate, {
          toValue: 360,
          duration: 1000,
          easing: Easing.bounce,
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

  // CHAOS HAPTIC PATTERN
  const startChaosHaptics = () => {
    // Insane vibration pattern
    const pattern = [50, 50, 100, 50, 200, 100, 50, 50, 300, 50];
    Vibration.vibrate(pattern, true);
    
    // Random heavy impacts
    const hapticInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      if (Math.random() > 0.7) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 200);
    
    return hapticInterval;
  };

  useEffect(() => {
    // MAXIMUM CHAOS MODE ACTIVATED
    StatusBar.setBarStyle('light-content');
    setStrobeMode(true);
    
    // Start all chaos effects
    startChaosAnimations();
    startEntranceAnimation();
    const hapticInterval = startChaosHaptics();
    
    // Trigger initial chaos explosion
    triggerChaos(chaosLevel);
    triggerExplosion(screenWidth / 2, screenHeight / 2);
    
    // Play retro sounds
    playRetroSound('powerup');
    
    // Random emoji changes
    const emojiInterval = setInterval(() => {
      setCurrentEmoji(CHAOS_EMOJIS[Math.floor(Math.random() * CHAOS_EMOJIS.length)]);
      playRetroSound('coin');
    }, 500);
    
    // Background color strobing
    const colorInterval = setInterval(() => {
      setBackgroundColorIndex(prev => (prev + 1) % STROBE_COLORS.length);
    }, 100);
    
    // Random chaos triggers
    const chaosInterval = setInterval(() => {
      triggerChaos(Math.floor(Math.random() * 5) + 1);
      const x = Math.random() * screenWidth;
      const y = Math.random() * screenHeight;
      triggerExplosion(x, y);
    }, 2000);

    return () => {
      // Cleanup
      Vibration.cancel();
      setStrobeMode(false);
      clearInterval(hapticInterval);
      clearInterval(emojiInterval);
      clearInterval(colorInterval);
      clearInterval(chaosInterval);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const handleAccept = () => {
    // EXPLOSION ON ACCEPT
    triggerChaos(5);
    triggerExplosion(screenWidth / 2, screenHeight - 200);
    playRetroSound('explosion');
    
    // Crazy button animation
    Animated.sequence([
      Animated.timing(acceptButtonScale, {
        toValue: 3,
        duration: 200,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.timing(acceptButtonScale, {
        toValue: 0,
        duration: 300,
        easing: Easing.elastic(2),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Vibration.cancel();
      setStrobeMode(false);
      if (sound) sound.stopAsync();
      onAccept?.();
    });
  };

  const handleDecline = () => {
    // MEGA EXPLOSION ON DECLINE
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const x = Math.random() * screenWidth;
        const y = Math.random() * screenHeight;
        triggerExplosion(x, y);
        playRetroSound('laser');
      }, i * 100);
    }
    
    Animated.sequence([
      Animated.timing(declineButtonScale, {
        toValue: 0,
        duration: 500,
        easing: Easing.exp,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Vibration.cancel();
      setStrobeMode(false);
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

  const strobeInterpolation = strobeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', STROBE_COLORS[backgroundColorIndex]],
  });
  
  return (
    <Animated.View style={[
      StyleSheet.absoluteFillObject,
      {
        transform: [
          { translateX: shakeAnim },
          { rotate: rotateAnim.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '5deg']
          })},
        ],
      }
    ]}>
      {/* CHAOS STROBE BACKGROUND */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: strobeInterpolation }
        ]}
      />
      <LinearGradient
        colors={[STROBE_COLORS[backgroundColorIndex], STROBE_COLORS[(backgroundColorIndex + 1) % STROBE_COLORS.length], STROBE_COLORS[(backgroundColorIndex + 2) % STROBE_COLORS.length]]}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]}
        start={{ x: Math.random(), y: Math.random() }}
        end={{ x: Math.random(), y: Math.random() }}
      />
      
      {/* Glitch overlay */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFillObject,
          { 
            backgroundColor: STROBE_COLORS[Math.floor(Math.random() * STROBE_COLORS.length)],
            opacity: glitchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5]
            })
          }
        ]}
      />

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
          {/* CHAOS CALL TYPE */}
          <Animated.View style={[
            styles.callTypeContainer,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: emojiRotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                })}
              ],
              backgroundColor: STROBE_COLORS[backgroundColorIndex]
            }
          ]}>
            <Text style={styles.chaosCallText}>🔥 CHAOS VIDEO 🔥</Text>
          </Animated.View>

          {/* EMOJI AVATAR CHAOS */}
          <Animated.View
            style={[
              styles.callerPhotoContainer,
              {
                transform: [
                  { scale: Animated.multiply(pulseAnim, emojiScale) },
                  { rotate: emojiRotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })}
                ],
              },
            ]}
          >
            <View style={[styles.emojiAvatar, { backgroundColor: STROBE_COLORS[(backgroundColorIndex + 3) % STROBE_COLORS.length] }]}>
              <Text style={styles.emojiText}>{currentEmoji}</Text>
            </View>
            {/* Floating emojis around avatar */}
            {CHAOS_EMOJIS.slice(0, 6).map((emoji, index) => (
              <Animated.Text
                key={index}
                style={[
                  styles.floatingEmoji,
                  {
                    transform: [
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 360],
                          outputRange: [`${index * 60}deg`, `${index * 60 + 360}deg`]
                        })
                      },
                      {
                        translateX: Animated.multiply(
                          pulseAnim,
                          80
                        )
                      }
                    ],
                  }
                ]}
              >
                {emoji}
              </Animated.Text>
            ))}
          </Animated.View>

          {/* CHAOS CALLER INFO */}
          <Animated.Text style={[
            styles.callerName,
            {
              color: STROBE_COLORS[backgroundColorIndex],
              transform: [{ scale: pulseAnim }],
              textShadowColor: STROBE_COLORS[(backgroundColorIndex + 1) % STROBE_COLORS.length],
              textShadowOffset: { width: 5, height: 5 },
              textShadowRadius: 10,
            }
          ]}>
            {callerName}
          </Animated.Text>
          <Animated.Text style={[
            styles.callerNumber,
            {
              color: STROBE_COLORS[(backgroundColorIndex + 2) % STROBE_COLORS.length],
              transform: [{ scale: Animated.divide(2, pulseAnim) }],
            }
          ]}>
            {callerNumber}
          </Animated.Text>
          <Animated.Text style={[
            styles.callingStatus,
            {
              color: STROBE_COLORS[(backgroundColorIndex + 4) % STROBE_COLORS.length],
              fontSize: 24,
              fontWeight: 'bold',
            }
          ]}>
            🔥 MAXIMUM CHAOS INCOMING 🔥
          </Animated.Text>
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
    </Animated.View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 0,
    marginBottom: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  chaosCallText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
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
  emojiAvatar: {
    width: 160,
    height: 160,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#fff',
  },
  emojiText: {
    fontSize: 100,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 30,
    top: 60,
    left: 60,
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