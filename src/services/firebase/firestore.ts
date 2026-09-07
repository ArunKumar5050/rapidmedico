import { initializeFirestore } from 'firebase/firestore';
import { app } from './app';

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
