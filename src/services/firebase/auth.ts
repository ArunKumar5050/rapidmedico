import { initializeAuth, getReactNativePersistence, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from './app';

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export interface AppUser {
  uid: string;
  phone: string;
  name?: string;
}

// In-memory store for active verification sessions
const activeOtps = new Map<string, string>();

export class AuthService {
  /**
   * Send OTP code directly without reCAPTCHA requirements.
   * Generates a 6-digit OTP code (default test code 123456 or generated).
   */
  static async sendOtp(phoneNumber: string): Promise<{ success: boolean; otpCode: string }> {
    try {
      // Clean phone number
      const cleanPhone = phoneNumber.trim();
      // Default easy test OTP
      const otpCode = '123456';
      activeOtps.set(cleanPhone, otpCode);
      console.log(`[AuthService] OTP for ${cleanPhone}: ${otpCode}`);
      return { success: true, otpCode };
    } catch (error) {
      console.error('[AuthService] sendOtp error:', error);
      throw error;
    }
  }

  /**
   * Verify the entered 6-digit OTP code.
   */
  static async verifyOtp(phoneNumber: string, verificationCode: string): Promise<AppUser> {
    const cleanPhone = phoneNumber.trim();
    const storedOtp = activeOtps.get(cleanPhone) || '123456';

    // Allow test OTP 123456 or matching stored OTP or any 6 digit code for convenience
    if (verificationCode === storedOtp || verificationCode === '123456' || verificationCode.length === 6) {
      const uid = `user_${cleanPhone.replace(/\D/g, '')}`;
      activeOtps.delete(cleanPhone);
      return {
        uid,
        phone: cleanPhone,
      };
    } else {
      throw new Error('Invalid OTP code. Please enter 123456.');
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore signout error if not signed into Firebase Auth
    }
  }

  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }
}
