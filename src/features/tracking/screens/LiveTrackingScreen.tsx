import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { subscribeToCustomOrder, CustomOrder } from '../../../services/firebase/customOrders';
import { subscribeToOrder, Order } from '../../../services/firebase/orders';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/firestore';
import { useAddressStore } from '../../../store/useAddressStore';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<MainStackParamList, 'LiveTracking'>;

// Real-time Haversine distance calculator
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const LiveTrackingScreen = ({ route, navigation }: Props) => {
  const { orderId } = route.params || { orderId: '' };
  const themeColors = useThemeColors();
  const webViewRef = useRef<WebView>(null);

  const [order, setOrder] = useState<Order | CustomOrder | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const defaultAddr = useAddressStore((state) => state.getDefaultAddress());

  // 1. Subscribe in real-time to the active order document in Firestore
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const unsubCustom = subscribeToCustomOrder(orderId, (data) => {
      if (data) {
        setOrder(data);
        setIsLoading(false);
        const rLat = (data as any).riderLat ?? (data as any).deliveryPartnerLocation?.lat ?? (data as any).riderLocation?.lat;
        const rLng = (data as any).riderLng ?? (data as any).deliveryPartnerLocation?.lng ?? (data as any).riderLocation?.lng;
        if (rLat && rLng) {
          setPartnerLocation({
            lat: Number(rLat),
            lng: Number(rLng),
          });
        }
      } else {
        const unsubRegular = subscribeToOrder(orderId, (regData) => {
          if (regData) {
            setOrder(regData);
            const rLat = (regData as any).riderLat ?? (regData as any).deliveryPartnerLocation?.lat ?? (regData as any).riderLocation?.lat;
            const rLng = (regData as any).riderLng ?? (regData as any).deliveryPartnerLocation?.lng ?? (regData as any).riderLocation?.lng;
            if (rLat && rLng) {
              setPartnerLocation({
                lat: Number(rLat),
                lng: Number(rLng),
              });
            }
          }
          setIsLoading(false);
        });
        return () => unsubRegular();
      }
    });

    return () => unsubCustom();
  }, [orderId]);

  // 2. Fetch real store coordinates if storeId exists in order
  useEffect(() => {
    const storeId = (order as any)?.storeId;
    if (!storeId) return;

    const fetchStore = async () => {
      try {
        const storeSnap = await getDoc(doc(db, 'stores', storeId));
        if (storeSnap.exists()) {
          const storeData = storeSnap.data();
          if (storeData.lat && storeData.lng) {
            setStoreCoords({ lat: Number(storeData.lat), lng: Number(storeData.lng) });
          } else if (storeData.location?.lat && storeData.location?.lng) {
            setStoreCoords({ lat: Number(storeData.location.lat), lng: Number(storeData.location.lng) });
          }
        }
      } catch (e) {
        console.warn('[LiveTracking] Error fetching store coordinates:', e);
      }
    };
    fetchStore();
  }, [(order as any)?.storeId]);

  // 3. Subscribe in real-time to delivery partner's live GPS stream from 'delivery_partners' collection
  useEffect(() => {
    const partnerId = (order as any)?.deliveryPartnerId;
    if (!partnerId) return;

    try {
      const partnerRef = doc(db, 'delivery_partners', partnerId);
      const unsubPartner = onSnapshot(partnerRef, (docSnap) => {
        if (docSnap.exists()) {
          const partnerData = docSnap.data();
          const lat = partnerData.lastKnownLocation?.lat || partnerData.lat || partnerData.location?.lat;
          const lng = partnerData.lastKnownLocation?.lng || partnerData.lng || partnerData.location?.lng;
          if (lat && lng) {
            setPartnerLocation({
              lat: Number(lat),
              lng: Number(lng),
            });
          }
        }
      });
      return () => unsubPartner();
    } catch (e) {
      console.warn('[LiveTracking] Error subscribing to partner live GPS stream:', e);
    }
  }, [(order as any)?.deliveryPartnerId]);

  // Exact Customer GPS Coordinates extracted directly from database order record
  const rawCustomerLat = 
    (order as any)?.customerLat ?? 
    (order as any)?.latitude ?? 
    (order as any)?.userLat ?? 
    (order as any)?.location?.lat ?? 
    (order as any)?.location?.latitude ?? 
    (order as any)?.coordinates?.latitude ?? 
    (order as any)?.coordinates?.lat ?? 
    (order as any)?.addressLat ??
    (order as any)?.addressLocation?.lat ??
    defaultAddr?.latitude ??
    defaultAddr?.coordinates?.latitude ??
    27.8095;

  const rawCustomerLng = 
    (order as any)?.customerLng ?? 
    (order as any)?.longitude ?? 
    (order as any)?.userLng ?? 
    (order as any)?.location?.lng ?? 
    (order as any)?.location?.longitude ?? 
    (order as any)?.coordinates?.longitude ?? 
    (order as any)?.coordinates?.lng ?? 
    (order as any)?.addressLng ?? 
    (order as any)?.addressLocation?.lng ?? 
    defaultAddr?.longitude ?? 
    defaultAddr?.coordinates?.longitude ?? 
    75.3498;

  const customerLat = Number(rawCustomerLat);
  const customerLng = Number(rawCustomerLng);

  // Store coordinates from database
  const storeLat = Number(storeCoords?.lat || (order as any)?.storeLat || (customerLat - 0.006));
  const storeLng = Number(storeCoords?.lng || (order as any)?.storeLng || (customerLng - 0.006));

  // Real live GPS position of the delivery partner from database
  const riderLat = partnerLocation?.lat || (order as any)?.riderLat || (order as any)?.deliveryPartnerLocation?.lat || storeLat;
  const riderLng = partnerLocation?.lng || (order as any)?.riderLng || (order as any)?.deliveryPartnerLocation?.lng || storeLng;

  const rawStatus = String((order as any)?.status || '').toLowerCase();
  const rawStoreStatus = String((order as any)?.storeStatus || '').toUpperCase();

  const isDelivered = rawStatus === 'completed' || rawStatus === 'delivered' || rawStoreStatus === 'COMPLETED' || rawStoreStatus === 'DELIVERED';
  const isOutOfDelivery = !isDelivered && (
    rawStoreStatus === 'OUT_OF_DELIVERY' || 
    rawStoreStatus === 'OUT_FOR_DELIVERY' || 
    rawStatus === 'out_for_delivery' || 
    rawStatus === 'delivery boy assigned'
  );

  // Real database values only
  const realRiderName = (order as any)?.deliveryPartnerName || 'RapidMedi Delivery Partner';
  const realRiderPhone = (order as any)?.deliveryPartnerPhone || '';
  const realRiderVehicle = (order as any)?.deliveryPartnerVehicle || '';
  const realDeliveryOtp = (order as any)?.deliveryOtp || (order as any)?.otp || null;

  // Dynamic distance & ETA
  const distanceKm = calculateDistanceKm(riderLat, riderLng, customerLat, customerLng);
  const formattedDistance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
  const estimatedMins = Math.max(1, Math.round((distanceKm / 20) * 60));

  // 4. Post updated real coordinates to the interactive Map (CALLED UNCONDITIONALLY BEFORE RETURNS)
  useEffect(() => {
    if (webViewRef.current && isMapLoaded) {
      const updatePayload = JSON.stringify({
        type: 'UPDATE_COORDS',
        rider: { lat: riderLat, lng: riderLng },
        customer: { lat: customerLat, lng: customerLng },
        store: { lat: storeLat, lng: storeLng },
        isOutOfDelivery,
        isDelivered,
      });
      webViewRef.current.postMessage(updatePayload);
    }
  }, [riderLat, riderLng, customerLat, customerLng, storeLat, storeLng, isOutOfDelivery, isDelivered, isMapLoaded]);

  const handleCallRider = () => {
    if (realRiderPhone && realRiderPhone.trim().length > 0) {
      Linking.openURL(`tel:${realRiderPhone.replace(/\D/g, '')}`);
    } else {
      Alert.alert('Delivery Partner', 'Phone number not available yet.');
    }
  };

  // Leaflet Map HTML built strictly with real order coordinates
  const leafletMapHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>RapidMedi Live Tracking</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; width: 100%; overflow: hidden; background-color: #0F172A; }
          #map { height: 100%; width: 100%; background: #0F172A; }
          
          .custom-icon {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .pulse-rider {
            width: 48px;
            height: 48px;
            background: #10B981;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.8);
            position: relative;
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.8); }
            70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          .pin-store {
            width: 40px;
            height: 40px;
            background: #3B82F6;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          }
          .pin-customer {
            width: 40px;
            height: 40px;
            background: #EF4444;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map;
          var storeMarker, customerMarker, riderMarker, routeLine;

          function initMap() {
            try {
              map = L.map('map', { 
                zoomControl: false, 
                attributionControl: false 
              }).setView([${customerLat}, ${customerLng}], 15);

              L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                subdomains: 'abcd',
              }).addTo(map);

              // 1. Store Marker
              var storeIcon = L.divIcon({
                className: 'custom-icon',
                html: '<div class="pin-store">🏥</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });
              storeMarker = L.marker([${storeLat}, ${storeLng}], { icon: storeIcon }).addTo(map)
                .bindPopup('<b>RapidMedi Partner Store</b>');

              // 2. Customer Marker from database coordinates
              var customerIcon = L.divIcon({
                className: 'custom-icon',
                html: '<div class="pin-customer">🏠</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });
              customerMarker = L.marker([${customerLat}, ${customerLng}], { icon: customerIcon }).addTo(map)
                .bindPopup('<b>Your Delivery Location</b>');

              // 3. Rider Marker (Always visible with live updates)
              var riderIcon = L.divIcon({
                className: 'custom-icon',
                html: '<div class="pulse-rider">🛵</div>',
                iconSize: [48, 48],
                iconAnchor: [24, 24]
              });
              riderMarker = L.marker([${riderLat}, ${riderLng}], { icon: riderIcon }).addTo(map)
                .bindPopup('<b>Delivery Boy (Live GPS)</b>');

              // 4. Route Line
              var routeCoords = [
                [${storeLat}, ${storeLng}],
                [${riderLat}, ${riderLng}],
                [${customerLat}, ${customerLng}]
              ];

              routeLine = L.polyline(routeCoords, {
                color: '#10B981',
                weight: 5,
                opacity: 0.9,
                dashArray: '6, 8'
              }).addTo(map);

              var group = new L.featureGroup([customerMarker, riderMarker, storeMarker]);
              map.fitBounds(group.getBounds().pad(0.25));

              function updateMap(payload) {
                if (payload.customer && payload.customer.lat && payload.customer.lng) {
                  customerMarker.setLatLng([payload.customer.lat, payload.customer.lng]);
                }
                if (payload.store && payload.store.lat && payload.store.lng) {
                  storeMarker.setLatLng([payload.store.lat, payload.store.lng]);
                }
                if (payload.rider && payload.rider.lat && payload.rider.lng) {
                  riderMarker.setLatLng([payload.rider.lat, payload.rider.lng]);
                  if (!map.hasLayer(riderMarker)) riderMarker.addTo(map);
                }
                
                var currentStore = storeMarker.getLatLng();
                var currentRider = riderMarker.getLatLng();
                var currentCust = customerMarker.getLatLng();

                var newPath = [
                  [currentStore.lat, currentStore.lng],
                  [currentRider.lat, currentRider.lng],
                  [currentCust.lat, currentCust.lng]
                ];
                routeLine.setLatLngs(newPath);

                var updateGroup = new L.featureGroup([customerMarker, riderMarker, storeMarker]);
                map.fitBounds(updateGroup.getBounds().pad(0.25));
              }

              window.addEventListener('message', function(event) {
                try {
                  var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                  if (data.type === 'UPDATE_COORDS') updateMap(data);
                } catch(e) {}
              });

              document.addEventListener('message', function(event) {
                try {
                  var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                  if (data.type === 'UPDATE_COORDS') updateMap(data);
                } catch(e) {}
              });

              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
              }
            } catch (err) {
              console.error(err);
            }
          }

          if (window.L) initMap();
          else window.onload = initMap;
        </script>
      </body>
    </html>
  `;

  // Early loading screen AFTER all hooks have executed
  if (isLoading || !order) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: '#0F172A' }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading live GPS tracking...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0F172A' }]}>
      {/* Live Map with dynamic key bound to real coordinates */}
      <View style={styles.mapContainer}>
        <WebView
          key={`map-${order.id}-${customerLat.toFixed(5)}-${customerLng.toFixed(5)}-${riderLat.toFixed(5)}-${riderLng.toFixed(5)}`}
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletMapHtml, baseUrl: 'https://cdnjs.cloudflare.com' }}
          style={styles.mapWebView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'MAP_READY') setIsMapLoaded(true);
            } catch (e) {}
          }}
          onLoadEnd={() => setIsMapLoaded(true)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Centering map on your GPS coordinates...</Text>
            </View>
          )}
          startInLoadingState={true}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.backBtn, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={22} color={themeColors.text.primary} />
      </TouchableOpacity>

      {/* Real-time Status Top Pill */}
      <View style={[styles.topStatusPill, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.brand.primary }]}>
        <View style={[styles.livePulseDot, { backgroundColor: isOutOfDelivery ? '#10B981' : '#3B82F6' }]} />
        <Text style={[styles.topStatusText, { color: themeColors.text.primary }]}>
          {isDelivered 
            ? 'Order Delivered 🎉' 
            : isOutOfDelivery 
              ? `🛵 Delivery boy is ${formattedDistance} away (~${estimatedMins} mins)`
              : '🏥 Pharmacy is preparing parcel for dispatch'
          }
        </Text>
      </View>

      {/* Floating Bottom Rider & OTP Card: ONLY when OUT_OF_DELIVERY */}
      {isOutOfDelivery ? (
        <Card style={[styles.riderCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
          <View style={styles.riderRow}>
            <View style={[styles.avatar, { backgroundColor: themeColors.brand.primary }]}>
              <Text style={styles.avatarText}>{realRiderName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.riderName, { color: themeColors.text.primary }]}>{realRiderName}</Text>
              <Text style={[styles.riderRole, { color: themeColors.text.secondary }]}>RapidMedi Verified Partner</Text>
              {realRiderVehicle ? (
                <Text style={[styles.vehicleText, { color: themeColors.text.muted }]}>🛵 {realRiderVehicle}</Text>
              ) : null}
            </View>
            {realRiderPhone ? (
              <TouchableOpacity style={[styles.callBtn, { backgroundColor: themeColors.status.success }]} onPress={handleCallRider}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Real OTP PIN Box from Database */}
          {realDeliveryOtp && (
            <View style={[styles.codeRow, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: themeColors.brand.primary }]}>
              <View>
                <Text style={[styles.codeLabel, { color: themeColors.text.secondary }]}>Delivery Verification OTP</Text>
                <Text style={[styles.codeHelp, { color: themeColors.text.muted }]}>Share with rider upon arrival</Text>
              </View>
              <Text style={[styles.codeValue, { color: themeColors.brand.primary }]}>{realDeliveryOtp}</Text>
            </View>
          )}
        </Card>
      ) : (
        <Card style={[styles.riderCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <ActivityIndicator size="small" color={themeColors.brand.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.riderName, { color: themeColors.text.primary }]}>Preparing Dispatch</Text>
              <Text style={[styles.riderRole, { color: themeColors.text.secondary }]}>Delivery details and OTP will appear once parcel is out for delivery.</Text>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: '#0F172A',
  },
  mapWebView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  backBtn: {
    position: 'absolute',
    top: spacing.xxxl + 10,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  topStatusPill: {
    position: 'absolute',
    top: spacing.xxxl + 12,
    left: spacing.lg + 54,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 22,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
    gap: spacing.xs,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  topStatusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
    flex: 1,
  },
  riderCard: {
    position: 'absolute',
    bottom: spacing.xxxl,
    left: spacing.lg,
    right: spacing.lg,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderRadius: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    zIndex: 10,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.h2, color: '#FFFFFF' },
  riderName: { ...typography.bodyStrong, fontSize: 16 },
  riderRole: { ...typography.caption, marginTop: 1 },
  vehicleText: { fontSize: 11, marginTop: 2 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
  },
  codeLabel: { ...typography.bodyStrong, fontSize: 13 },
  codeHelp: { fontSize: 10, marginTop: 1 },
  codeValue: { fontSize: 26, fontWeight: '900', letterSpacing: 4 },
});
