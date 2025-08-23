import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { CallManager } from './src/components/CallManager';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <CallManager>
        <AppNavigator />
      </CallManager>
    </SafeAreaProvider>
  );
}