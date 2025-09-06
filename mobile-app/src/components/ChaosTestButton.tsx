import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useChaos } from './ChaosProvider';
import { RetroTheme } from '../theme/retroTheme';
import CallService from '../services/CallService';

const { width: screenWidth } = Dimensions.get('window');

export const ChaosTestButton: React.FC = () => {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'instant' | 'delayed'>('instant');
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const { triggerChaos, triggerExplosion, playRetroSound } = useChaos();
  
  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Start floating animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);
  
  const triggerCall = () => {
    // Epic button animation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.5,
          duration: 200,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonRotate, {
        toValue: 360,
        duration: 500,
        easing: Easing.elastic(2),
        useNativeDriver: true,
      }),
    ]).start(() => {
      buttonRotate.setValue(0);
    });
    
    // Trigger chaos effects
    triggerChaos(3);
    triggerExplosion(screenWidth / 2, 100);
    playRetroSound('powerup');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    if (selectedMode === 'instant') {
      // Instant call
      CallService.startIncomingCall({
        callerName: '🔥 MAMA AI 🔥',
        callerNumber: '1-800-CHAOS',
        callerAvatar: '👹',
        callType: 'video',
        chaosLevel: 5,
      });
    } else {
      // Delayed call with countdown
      setCountdown(10);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            // Trigger call after countdown
            CallService.startIncomingCall({
              callerName: '⚡ MAMA AI ⚡',
              callerNumber: '666-DELAYED-CHAOS',
              callerAvatar: '🤖',
              callType: 'video',
              chaosLevel: 5,
            });
            return null;
          }
          // Chaos effects each second
          if (prev <= 5) {
            triggerChaos(prev);
            playRetroSound('coin');
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    setShowModeSelector(false);
  };
  
  const CHAOS_COLORS = RetroTheme.colors.neonGradient;
  
  return (
    <>
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { scale: buttonScale },
              { translateY: floatAnim },
              { rotate: buttonRotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })},
            ],
            shadowRadius: glowAnim.interpolate({
              inputRange: [1, 1.5],
              outputRange: [10, 30],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.testButton]}
          onPress={() => setShowModeSelector(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonEmoji}>🎮</Text>
          <Text style={styles.buttonText}>CHAOS TEST</Text>
          {countdown !== null && (
            <Text style={styles.countdownText}>{countdown}...</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {/* Mode Selector Modal */}
      <Modal
        visible={showModeSelector}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modeSelector}>
            <Text style={styles.modalTitle}>🔥 SELECT CHAOS MODE 🔥</Text>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'instant' && styles.selectedMode
              ]}
              onPress={() => {
                setSelectedMode('instant');
                Haptics.selectionAsync();
              }}
            >
              <Text style={styles.modeEmoji}>⚡</Text>
              <Text style={styles.modeText}>INSTANT CHAOS</Text>
              <Text style={styles.modeDescription}>Call immediately!</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'delayed' && styles.selectedMode
              ]}
              onPress={() => {
                setSelectedMode('delayed');
                Haptics.selectionAsync();
              }}
            >
              <Text style={styles.modeEmoji}>⏰</Text>
              <Text style={styles.modeText}>DELAYED DOOM</Text>
              <Text style={styles.modeDescription}>10 second countdown!</Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setShowModeSelector(false);
                  playRetroSound('laser');
                }}
              >
                <Text style={styles.actionButtonText}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.goButton]}
                onPress={triggerCall}
              >
                <Text style={styles.actionButtonText}>🚀 LAUNCH 🚀</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 10,
  },
  testButton: {
    backgroundColor: '#FF00FF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#00FFFF',
    alignItems: 'center',
  },
  buttonEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  countdownText: {
    color: '#FFFF00',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 0, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    backgroundColor: '#000000',
    width: '90%',
    padding: 20,
    borderWidth: 3,
    borderColor: '#00FFFF',
    borderRadius: 0,
  },
  modalTitle: {
    color: '#FF00FF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  modeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#666666',
    alignItems: 'center',
  },
  selectedMode: {
    borderColor: '#00FFFF',
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
  },
  modeEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  modeDescription: {
    color: '#00FFFF',
    fontSize: 14,
    marginTop: 5,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
  },
  cancelButton: {
    backgroundColor: '#FF0040',
    borderColor: '#FF0040',
  },
  goButton: {
    backgroundColor: '#00FF00',
    borderColor: '#00FF00',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});