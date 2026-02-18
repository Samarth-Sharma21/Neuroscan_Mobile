import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain } from 'lucide-react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { Colors, FontFamily, FontSize } from '../src/constants/theme';

const { height } = Dimensions.get('window');

export default function SplashLanding() {
  const { session, loading } = useAuth();
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(subtextOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth' as any);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, session]);

  return (
    <LinearGradient
      colors={['#0F766E', '#0D9488', '#14B8A6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}>
        <View style={styles.logoCircle}>
          <Brain size={48} color={Colors.primary} strokeWidth={1.8} />
        </View>
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        NeuroScan
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: subtextOpacity }]}>
        AI-Powered Dementia Detection
      </Animated.Text>

      <View style={styles.bottomDots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
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
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orb1: { width: 300, height: 300, top: -80, right: -100 },
  orb2: { width: 200, height: 200, bottom: -40, left: -60 },
  orb3: { width: 120, height: 120, top: height * 0.3, left: 20 },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
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
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
  },
  bottomDots: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
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
