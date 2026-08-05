import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import type { FirebaseApp } from 'firebase/app';

interface FirebaseRecaptchaProps {
  firebaseConfig: FirebaseApp['options'];
}

export interface RecaptchaVerifierRef {
  verify: () => Promise<string>;
}

/**
 * Custom reCAPTCHA verifier component that replaces deprecated expo-firebase-recaptcha.
 * Uses an invisible reCAPTCHA v2 rendered inside a WebView.
 *
 * Usage:
 *   const recaptchaRef = useRef<RecaptchaVerifierRef>(null);
 *   const token = await recaptchaRef.current.verify();
 *   // pass token to signInWithPhoneNumber as the appVerifier
 */
export const FirebaseRecaptchaVerifierModal = forwardRef<RecaptchaVerifierRef, FirebaseRecaptchaProps>(
  ({ firebaseConfig }, ref) => {
    const [visible, setVisible] = useState(false);
    const resolveRef = useRef<((token: string) => void) | null>(null);
    const rejectRef = useRef<((error: Error) => void) | null>(null);

    useImperativeHandle(ref, () => ({
      verify: () => {
        return new Promise<string>((resolve, reject) => {
          resolveRef.current = resolve;
          rejectRef.current = reject;
          setVisible(true);
        });
      },
      // Firebase signInWithPhoneNumber expects an object with a type property
      type: 'recaptcha',
    }));

    const handleMessage = useCallback((event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'verify' && data.token) {
          setVisible(false);
          resolveRef.current?.(data.token);
        } else if (data.type === 'error') {
          setVisible(false);
          rejectRef.current?.(new Error(data.message || 'reCAPTCHA verification failed'));
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    }, []);

    const siteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google test key for invisible reCAPTCHA

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: transparent; }
        </style>
        <script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>
      </head>
      <body>
        <div id="recaptcha-container"></div>
        <script>
          function onRecaptchaLoad() {
            try {
              grecaptcha.render('recaptcha-container', {
                sitekey: '${siteKey}',
                size: 'invisible',
                callback: function(token) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token }));
                },
                'error-callback': function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'reCAPTCHA error' }));
                }
              });
              grecaptcha.execute();
            } catch(e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
            }
          }
          
          // Wait for grecaptcha to load
          var checkInterval = setInterval(function() {
            if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.render === 'function') {
              clearInterval(checkInterval);
              onRecaptchaLoad();
            }
          }, 100);
          
          // Timeout after 15 seconds
          setTimeout(function() {
            clearInterval(checkInterval);
            if (typeof grecaptcha === 'undefined') {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'reCAPTCHA loading timeout' }));
            }
          }, 15000);
        </script>
      </body>
      </html>
    `;

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.webviewContainer}>
            <ActivityIndicator size="large" color="#4A90D9" style={styles.loader} />
            <WebView
              source={{ html }}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              style={styles.webview}
              originWhitelist={['*']}
            />
          </View>
        </View>
      </Modal>
    );
  }
);

FirebaseRecaptchaVerifierModal.displayName = 'FirebaseRecaptchaVerifierModal';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewContainer: {
    width: 300,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
    zIndex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
