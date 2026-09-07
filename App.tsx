import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { seedMedicinesToFirestore } from './src/services/firebase/medicines';

export default function App() {
  useEffect(() => {
    // Automatically seed 'Medicinename' collection to Firestore on initial launch if empty
    seedMedicinesToFirestore(false).catch((err) => {
      console.log('Medicine background sync notice:', err?.message || err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
        <RootNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

