import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../src/contexts/AuthContext';
import { Colors } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const splashHidden = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Safety: hide splash after 3s no matter what
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!splashHidden.current) {
        splashHidden.current = true;
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <StatusBar style='dark' />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name='index' />
        <Stack.Screen
          name='auth'
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name='(tabs)' />
        <Stack.Screen
          name='results/[id]'
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name='settings'
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </AuthProvider>
  );
}
