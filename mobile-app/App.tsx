import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ChaosProvider from './src/components/ChaosProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#FF00FF" />
      <ChaosProvider>
        <AppNavigator />
      </ChaosProvider>
    </SafeAreaProvider>
  );
}