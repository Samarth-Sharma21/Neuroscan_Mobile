import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain } from 'lucide-react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { Colors, FontFamily, FontSize } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashLanding() {
  const { session, loading } = useAuth();

  // Animated values
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;
  const orb3Anim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtextTranslateY = useRef(new Animated.Value(20)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0)).current;
  const dotOpacity2 = useRef(new Animated.Value(0)).current;
  const dotOpacity3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Background & orbs fade in
    Animated.parallel([
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.stagger(150, [
        Animated.spring(orb1Anim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true }),
        Animated.spring(orb2Anim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true }),
        Animated.spring(orb3Anim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();

    // Phase 2: Logo entrance with bounce + ring pulse
    const logoEntrance = Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Ring expands outward
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(ringOpacity, {
              toValue: 0.6,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(ringScale, {
              toValue: 1.6,
              tension: 30,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    // Phase 3: Text slides up
    const textEntrance = Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(textTranslateY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(50),
      Animated.parallel([
        Animated.spring(subtextTranslateY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(subtextOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]);

    // Phase 4: Line + dots
    const indicatorEntrance = Animated.sequence([
      Animated.delay(100),
      Animated.timing(lineWidth, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.stagger(100, [
        Animated.timing(dotOpacity1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]);

    // Run phases in sequence
    Animated.sequence([
      logoEntrance,
      textEntrance,
      indicatorEntrance,
    ]).start();

    // Continuous subtle pulse on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth' as any);
        }
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [loading, session]);

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
      <LinearGradient
        colors={['#0A5C55', '#0D9488', '#14B8A6', '#0F766E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          {
            opacity: orb1Anim,
            transform: [{ scale: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          {
            opacity: orb2Anim,
            transform: [{ scale: orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb3,
          {
            opacity: orb3Anim,
            transform: [{ scale: orb3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          },
        ]}
      />

      {/* Pulse ring behind logo */}
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnim) },
              { rotate: logoSpin },
            ],
          },
        ]}>
        <View style={styles.logoCircle}>
          <Brain size={48} color={Colors.primary} strokeWidth={1.8} />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}>
        NeuroScan
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtextOpacity,
            transform: [{ translateY: subtextTranslateY }],
          },
        ]}>
        AI-Powered Dementia Detection
      </Animated.Text>

      {/* Bottom indicator */}
      <View style={styles.bottomIndicator}>
        <Animated.View
          style={[
            styles.line,
            {
              width: lineWidth.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 40],
              }),
            },
          ]}
        />
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, styles.dotActive, { opacity: dotOpacity1 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 320,
    height: 320,
    top: -100,
    right: -120,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  orb2: {
    width: 220,
    height: 220,
    bottom: -50,
    left: -70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orb3: {
    width: 150,
    height: 150,
    top: height * 0.25,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoContainer: {
    marginBottom: 28,
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 16,
  },
  title: {
    fontSize: FontSize['4xl'],
    fontFamily: FontFamily.bold,
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
    gap: 12,
  },
  line: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
});
