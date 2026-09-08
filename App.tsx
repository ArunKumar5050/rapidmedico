import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
export default function App() {

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
        <RootNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

