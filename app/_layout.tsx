import { useEffect, useRef } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
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
import * as Updates from 'expo-updates';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { Colors } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Centralized auth guard.
 *
 * Rules:
 *  - While `loading` is true (initial session check), do nothing.
 *  - On the splash screen (`index`), do nothing — splash handles
 *    its own first‑time navigation after its animation finishes.
 *  - If the user HAS a session but is on the auth screen → go to (tabs).
 *  - If the user has NO session but is inside tabs / results / settings → go to auth.
 *
 * This means sign‑in / sign‑out transitions are all driven by the
 * `session` value in AuthContext — no manual router.replace in auth.tsx.
 */
function useProtectedRoute() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const onSplash = !firstSegment || firstSegment === 'index';
    const onAuth = firstSegment === 'auth';

    // Let the splash handle the very first navigation
    if (onSplash) return;

    if (session && onAuth) {
      // Signed in while on the auth screen → go to tabs
      router.replace('/(tabs)');
    } else if (!session && !onAuth) {
      // Signed out while on a protected screen → go to auth
      router.replace('/auth');
    }
  }, [session, loading, segments]);
}

function RootLayoutNavigator() {
  useProtectedRoute();

  return (
    <>
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
    </>
  );
}

export default function RootLayout() {
  const splashHidden = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Check for OTA updates on every launch and apply immediately
  useEffect(() => {
    async function checkForUpdate() {
      try {
        if (__DEV__) return; // skip in development
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // silently ignore update errors
      }
    }
    checkForUpdate();
  }, []);

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
      <RootLayoutNavigator />
    </AuthProvider>
  );
}
