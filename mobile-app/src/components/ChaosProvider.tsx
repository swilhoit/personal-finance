import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Chaos Context
interface ChaosContextType {
  triggerChaos: (level?: number) => void;
  triggerExplosion: (x: number, y: number) => void;
  playRetroSound: (sound: 'coin' | 'powerup' | 'explosion' | 'laser' | 'jump') => void;
  strobeMode: boolean;
  setStrobeMode: (enabled: boolean) => void;
}

const ChaosContext = createContext<ChaosContextType | undefined>(undefined);

export const useChaos = () => {
  const context = useContext(ChaosContext);
  if (!context) throw new Error('useChaos must be used within ChaosProvider');
  return context;
};

interface ChaosProviderProps {
  children: React.ReactNode;
}

// Retro color palette
const RETRO_COLORS = [
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFF00', // Yellow
  '#00FF00', // Lime
  '#FF69B4', // Hot Pink
  '#FFA500', // Orange
  '#FF1493', // Deep Pink
  '#00CED1', // Dark Turquoise
  '#FFD700', // Gold
  '#FF4500', // Orange Red
];

// Emoji avatars for maximum chaos
const CHAOS_EMOJIS = ['🔥', '💥', '⚡', '🌟', '✨', '🎮', '🚀', '🎯', '💎', '🌈', '🎪', '🎨'];

export const ChaosProvider: React.FC<ChaosProviderProps> = ({ children }) => {
  const [strobeMode, setStrobeMode] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [glitchEffect, setGlitchEffect] = useState(false);
  
  // Animation values
  const backgroundFlash = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const strobeAnimation = useRef(new Animated.Value(0)).current;
  
  // Sound refs
  const soundRefs = useRef<{ [key: string]: Audio.Sound }>({});

  // Initialize retro sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
        
        // Create synthetic retro sounds using oscillators
        // For now we'll use haptics as placeholders
      } catch (error) {
        console.log('Audio setup error:', error);
      }
    };
    
    loadSounds();
  }, []);

  // Strobe effect
  useEffect(() => {
    if (strobeMode) {
      const strobe = Animated.loop(
        Animated.sequence([
          Animated.timing(strobeAnimation, {
            toValue: 1,
            duration: 50,
            useNativeDriver: false,
          }),
          Animated.timing(strobeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: false,
          }),
        ])
      );
      strobe.start();
      
      // Aggressive haptic feedback
      const hapticInterval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 100);
      
      return () => {
        strobe.stop();
        clearInterval(hapticInterval);
      };
    }
  }, [strobeMode]);

  // Random chaos events
  useEffect(() => {
    const chaosInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        triggerRandomChaos();
      }
    }, 3000);
    
    return () => clearInterval(chaosInterval);
  }, []);

  const triggerRandomChaos = () => {
    const chaosType = Math.floor(Math.random() * 5);
    
    switch (chaosType) {
      case 0:
        // Screen shake
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
        break;
        
      case 1:
        // Rotation chaos
        Animated.timing(rotateAnimation, {
          toValue: Math.random() * 360,
          duration: 500,
          easing: Easing.bounce,
          useNativeDriver: true,
        }).start(() => {
          rotateAnimation.setValue(0);
        });
        break;
        
      case 2:
        // Scale pulse
        Animated.sequence([
          Animated.spring(scaleAnimation, {
            toValue: 1.2,
            friction: 2,
            tension: 160,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnimation, {
            toValue: 1,
            friction: 2,
            tension: 160,
            useNativeDriver: true,
          }),
        ]).start();
        break;
        
      case 3:
        // Glitch effect
        setGlitchEffect(true);
        setTimeout(() => setGlitchEffect(false), 200);
        break;
        
      case 4:
        // Random vibration pattern
        Vibration.vibrate([0, 50, 100, 50, 200, 100]);
        break;
    }
    
    // Random haptic
    if (Math.random() > 0.5) {
      Haptics.notificationAsync(
        Math.random() > 0.5 
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error
      );
    }
  };

  const triggerChaos = (level: number = 1) => {
    // Multi-level chaos
    for (let i = 0; i < level; i++) {
      setTimeout(() => {
        triggerRandomChaos();
        
        // Flash background
        Animated.sequence([
          Animated.timing(backgroundFlash, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.timing(backgroundFlash, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
          }),
        ]).start();
      }, i * 100);
    }
  };

  const triggerExplosion = (x: number, y: number) => {
    // Create particle explosion
    const newParticles = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 5 + Math.random() * 10;
      
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        emoji: CHAOS_EMOJIS[Math.floor(Math.random() * CHAOS_EMOJIS.length)],
        color: RETRO_COLORS[Math.floor(Math.random() * RETRO_COLORS.length)],
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 2000);
    
    // Explosion feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    triggerChaos(2);
  };

  const playRetroSound = (sound: string) => {
    // Haptic feedback as audio placeholder
    switch (sound) {
      case 'coin':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'powerup':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'explosion':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'laser':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'jump':
        Haptics.selectionAsync();
        break;
    }
  };

  const backgroundInterpolation = backgroundFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', RETRO_COLORS[Math.floor(Math.random() * RETRO_COLORS.length)]],
  });

  const strobeInterpolation = strobeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#FF0000'],
  });

  return (
    <ChaosContext.Provider 
      value={{ 
        triggerChaos, 
        triggerExplosion, 
        playRetroSound, 
        strobeMode, 
        setStrobeMode 
      }}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [
              { translateX: shakeAnimation },
              { rotate: rotateAnimation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })},
              { scale: scaleAnimation },
            ],
          }
        ]}
      >
        {/* Background chaos layers */}
        <Animated.View 
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: backgroundInterpolation }
          ]} 
          pointerEvents="none"
        />
        
        {/* Strobe effect */}
        {strobeMode && (
          <Animated.View 
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: strobeInterpolation, opacity: 0.3 }
            ]} 
            pointerEvents="none"
          />
        )}
        
        {/* Glitch effect */}
        {glitchEffect && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <BlurView intensity={100} style={StyleSheet.absoluteFillObject}>
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: RETRO_COLORS[Math.floor(Math.random() * RETRO_COLORS.length)], opacity: 0.3 }]} />
            </BlurView>
          </View>
        )}
        
        {/* Particles */}
        {particles.map(particle => (
          <Particle key={particle.id} {...particle} />
        ))}
        
        {/* Floating chaos emojis */}
        <FloatingChaos />
        
        {children}
      </Animated.View>
    </ChaosContext.Provider>
  );
};

// Particle component
const Particle: React.FC<any> = ({ x, y, vx, vy, emoji, color }) => {
  const translateX = useRef(new Animated.Value(x)).current;
  const translateY = useRef(new Animated.Value(y)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: x + vx * 50,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: y + vy * 50,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: 30,
        transform: [{ translateX }, { translateY }, { scale }],
        opacity,
        color,
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

// Floating chaos background
const FloatingChaos: React.FC = () => {
  const animations = useRef(
    Array.from({ length: 10 }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * SCREEN_HEIGHT),
      rotate: new Animated.Value(0),
    }))
  ).current;
  
  useEffect(() => {
    animations.forEach((anim, index) => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(anim.x, {
              toValue: Math.random() * SCREEN_WIDTH,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, {
              toValue: Math.random() * SCREEN_WIDTH,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(anim.y, {
              toValue: Math.random() * SCREEN_HEIGHT,
              duration: 4000 + index * 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: Math.random() * SCREEN_HEIGHT,
              duration: 4000 + index * 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.rotate, {
            toValue: 360,
            duration: 5000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);
  
  return (
    <>
      {animations.map((anim, index) => (
        <Animated.Text
          key={index}
          style={{
            position: 'absolute',
            fontSize: 40,
            opacity: 0.3,
            transform: [
              { translateX: anim.x },
              { translateY: anim.y },
              { rotate: anim.rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })},
            ],
          }}
        >
          {CHAOS_EMOJIS[index % CHAOS_EMOJIS.length]}
        </Animated.Text>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChaosProvider;