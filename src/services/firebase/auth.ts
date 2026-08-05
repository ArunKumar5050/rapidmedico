import { initializeAuth, signInWithPhoneNumber, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged, User, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from './app';

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

/**
 * A minimal ApplicationVerifier that satisfies Firebase's signInWithPhoneNumber.
 * In production, you should configure Firebase App Check or use 
 * @react-native-firebase/auth for proper native reCAPTCHA handling.
 */
class ReactNativeRecaptchaVerifier {
  type = 'recaptcha' as const;

  async verify(): Promise<string> {
    // Firebase JS SDK phone auth requires a reCAPTCHA token.
    // For development/testing, we return a test token.
    // For production, you need Firebase App Check or react-native-firebase.
    return 'recaptcha-token-placeholder';
  }
}

export class AuthService {
  private static confirmationResult: ConfirmationResult | null = null;

  static async sendOtp(phoneNumber: string): Promise<boolean> {
    try {
      const appVerifier = new ReactNativeRecaptchaVerifier();
      // @ts-ignore - Firebase expects ApplicationVerifier interface
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      this.confirmationResult = confirmation;
      return true;
    } catch (error) {
      console.warn('[AuthService] sendOtp error:', error);
      throw error;
    }
  }

  static async verifyOtp(verificationCode: string): Promise<User> {
    try {
      if (this.confirmationResult) {
        const result = await this.confirmationResult.confirm(verificationCode);
        return result.user;
      }
      throw new Error('No pending OTP verification session found.');
    } catch (error) {
      console.error('[AuthService] verifyOtp error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }
}

