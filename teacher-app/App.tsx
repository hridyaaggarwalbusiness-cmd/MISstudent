import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { RootNavigator } from '@navigation/RootNavigator';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { useAuthStore } from '@store/useAuthStore';
import { colors } from '@theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const { user, teacher, initializing, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && !initializing) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, initializing]);

  if ((!fontsLoaded && !fontError) || initializing) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayoutRootView}>
          <StatusBar style="dark" />
          {user && teacher ? <RootNavigator /> : <LoginScreen />}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
