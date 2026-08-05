import React, { useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { useThemeColors } from '../../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { payCustomOrder } from '../../../services/firebase/customOrders';
import Constants from 'expo-constants';

type Props = NativeStackScreenProps<MainStackParamList, 'RazorpayCheckout'>;

export const RazorpayCheckoutScreen = ({ navigation, route }: Props) => {
  const { orderId, amount, isCustomOrder } = route.params;
  const themeColors = useThemeColors();
  const webViewRef = useRef<WebView>(null);

  const razorpayKeyId = Constants.expoConfig?.extra?.razorpayTestKeyId || 'rzp_test_Shgq35vj7SGKmI';

  // We generate a dynamic HTML page that loads Razorpay and automatically opens the checkout
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #f8f9fa; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
        .loader { border: 4px solid #f3f3f3; border-radius: 50%; border-top: 4px solid #3498db; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="loader" id="loader"></div>
      <script>
        var options = {
          "key": "${razorpayKeyId}",
          "amount": "${Math.round(amount * 100)}", // Amount is in currency subunits (paise)
          "currency": "INR",
          "name": "RapidMedi",
          "description": "Order Payment",
          "theme": {
              "color": "#121A2F"
          },
          "handler": function (response) {
             // Payment successful
             window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', data: response }));
          },
          "modal": {
              "ondismiss": function() {
                 window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'dismissed' }));
              }
          }
        };

        var rzp1 = new Razorpay(options);
        
        rzp1.on('payment.failed', function (response){
           window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'failed', data: response.error }));
        });

        // Open Razorpay automatically when the page loads
        window.onload = function() {
          document.getElementById('loader').style.display = 'none';
          rzp1.open();
        };
      </script>
    </body>
    </html>
  `;

  const handleMessage = async (event: any) => {
    try {
      const result = JSON.parse(event.nativeEvent.data);

      if (result.status === 'success') {
        // Payment successful
        if (isCustomOrder) {
          await payCustomOrder(orderId);
        } else {
          // Handle standard order payment success
        }

        Alert.alert(
          "Payment Successful",
          "Your order has been paid and confirmed!",
          [
            { text: "View Orders", onPress: () => navigation.navigate('Tabs', { screen: 'Orders' } as any) },
            { text: "OK", onPress: () => navigation.navigate('Tabs') }
          ]
        );
      } else if (result.status === 'failed') {
        Alert.alert("Payment Failed", result.data?.description || "Something went wrong.");
        navigation.goBack();
      } else if (result.status === 'dismissed') {
        // User closed the Razorpay modal
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not process payment response.");
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Secure Payment" showBack onBack={() => navigation.goBack()} />
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        style={styles.webview}
        // These are required for Razorpay to work properly in a WebView
        originWhitelist={['*']}
        mixedContentMode="always"
        thirdPartyCookiesEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});
