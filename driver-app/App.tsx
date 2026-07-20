import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from '@screens/LoginScreen';
import { DriverHomeScreen } from '@screens/DriverHomeScreen';
import { useAuthStore } from '@store/useAuthStore';

export default function App() {
  const { user, driver, initializing, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (initializing) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        {user && driver ? <DriverHomeScreen /> : <LoginScreen />}
      </View>
    </SafeAreaProvider>
  );
}
