export const RetroTheme = {
  colors: {
    neonPink: '#FF10F0',
    electricBlue: '#00D4FF',
    laserGreen: '#39FF14',
    cyberYellow: '#FFFF00',
    hotMagenta: '#FF00FF',
    retroOrange: '#FF6600',
    plasmaRed: '#FF0040',
    vaporPurple: '#9D00FF',
    pixelWhite: '#FFFFFF',
    glitchBlack: '#000000',
    
    // Gradient arrays for chaos
    neonGradient: ['#FF10F0', '#00D4FF', '#39FF14'],
    fireGradient: ['#FF0040', '#FF6600', '#FFFF00'],
    vaporGradient: ['#FF00FF', '#9D00FF', '#00D4FF'],
    matrixGradient: ['#00FF00', '#39FF14', '#00D4FF'],
  },
  
  fonts: {
    pixel: 'Courier New', // Will be replaced with actual pixel font
    retro: 'monospace',
  },
  
  animations: {
    // Animation presets
    glitch: {
      duration: 100,
      intensity: 5,
    },
    pulse: {
      duration: 500,
      scale: 1.2,
    },
    shake: {
      duration: 50,
      intensity: 10,
    },
    rainbow: {
      duration: 2000,
      colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
    },
  },
  
  sounds: {
    // Sound effect mappings
    coin: { frequency: 800, duration: 100 },
    powerup: { frequency: [400, 800, 1200], duration: 300 },
    explosion: { frequency: [100, 50, 25], duration: 500 },
    laser: { frequency: [2000, 1000], duration: 200 },
    jump: { frequency: [200, 400], duration: 150 },
    error: { frequency: [150, 100], duration: 200 },
    success: { frequency: [500, 700, 900], duration: 400 },
  },
  
  particles: {
    maxCount: 50,
    emojis: ['💥', '⚡', '🔥', '✨', '🌟', '💫', '🎆', '🎇', '🎯', '🎮', '🚀', '👾'],
    sizes: [20, 25, 30, 35, 40],
    speeds: [100, 200, 300, 400, 500],
  },
  
  chaos: {
    levels: {
      calm: 0,
      mild: 1,
      moderate: 2,
      intense: 3,
      extreme: 4,
      maximum: 5,
    },
    triggers: {
      onPress: true,
      onScroll: true,
      onSwipe: true,
      random: true,
      continuous: false,
    },
  },
  
  avatar: {
    emojis: {
      mama: '👩‍🎤',
      user: '🎮',
      ai: '🤖',
      chaos: '👾',
      fire: '🔥',
      star: '⭐',
      rocket: '🚀',
      alien: '👽',
      ghost: '👻',
      demon: '😈',
    },
    animations: {
      bounce: true,
      rotate: true,
      pulse: true,
      shake: true,
    },
  },
  
  ui: {
    borderRadius: 0, // Sharp pixels
    borderWidth: 3,
    shadowIntensity: 10,
    glowIntensity: 20,
    scanlines: true,
    crtEffect: true,
    pixelate: true,
  },
};

// Chaos level configurations
export const ChaosLevels = {
  0: {
    name: 'Zen Mode',
    vibration: false,
    particles: 0,
    shakeIntensity: 0,
    strobeSpeed: 0,
    soundVolume: 0,
  },
  1: {
    name: 'Mild Chaos',
    vibration: 'light',
    particles: 10,
    shakeIntensity: 2,
    strobeSpeed: 0,
    soundVolume: 0.3,
  },
  2: {
    name: 'Party Mode',
    vibration: 'medium',
    particles: 25,
    shakeIntensity: 5,
    strobeSpeed: 500,
    soundVolume: 0.5,
  },
  3: {
    name: 'Rave Mode',
    vibration: 'heavy',
    particles: 40,
    shakeIntensity: 10,
    strobeSpeed: 200,
    soundVolume: 0.7,
  },
  4: {
    name: 'Chaos Realm',
    vibration: 'pattern',
    particles: 60,
    shakeIntensity: 15,
    strobeSpeed: 100,
    soundVolume: 0.9,
  },
  5: {
    name: '🔥 MAXIMUM OVERDRIVE 🔥',
    vibration: 'continuous',
    particles: 100,
    shakeIntensity: 20,
    strobeSpeed: 50,
    soundVolume: 1.0,
  },
};

// Retro ASCII art for fun
export const RetroArt = {
  skull: `
    ░░░░░░░░░░░░░░░░░
    ░░▄█▀▀▀░░░░░▀▀▀█▄
    ░█▀░░░░░░░░░░░░░▀█
    ░█░░░░░░░░░░░░░░░█
    ░█░░▀▀▀░░▄▄▄░░░░█
    ░░█▄░░░░░░░░░░░▄█
    ░░░░▀▀█▄▄▄▄▄█▀▀
  `,
  
  fire: `
    🔥🔥🔥🔥🔥
    🔥🔥🔥🔥🔥
    🔥🔥🔥🔥🔥
  `,
  
  explosion: `
    💥💥💥💥💥
    💥💥💥💥💥
    💥💥💥💥💥
  `,
};