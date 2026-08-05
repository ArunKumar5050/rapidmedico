import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TextInput } from '../../../components/ui/TextInput';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { createCustomOrder } from '../../../services/firebase/customOrders';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderRequest'>;

export const CustomOrderRequestScreen = ({ navigation, route }: Props) => {
  const { initialMedicineName = '' } = route.params || {};
  const themeColors = useThemeColors();
  const { user } = useAuthStore();
  
  const [medicines, setMedicines] = useState<string[]>([initialMedicineName]);
  const [userName, setUserName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.phone || '');
  
  // Address states
  const [locationAddress, setLocationAddress] = useState('');
  const [flatDetails, setFlatDetails] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMedicine = () => {
    setMedicines([...medicines, '']);
  };

  const handleMedicineChange = (text: string, index: number) => {
    const newMedicines = [...medicines];
    newMedicines[index] = text;
    setMedicines(newMedicines);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length > 1) {
      const newMedicines = [...medicines];
      newMedicines.splice(index, 1);
      setMedicines(newMedicines);
    }
  };

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setIsFetchingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        // Combine available fields for a readable building/street address
        const addressParts = [place.name, place.street, place.subregion, place.city, place.postalCode].filter(Boolean);
        setLocationAddress(addressParts.join(', '));
      } else {
        Alert.alert('Location Error', 'Could not determine your address.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSubmit = async () => {
    const validMedicines = medicines.filter(m => m.trim().length > 0);
    const finalMedicineString = validMedicines.join(', ');
    const finalAddress = `Flat/Floor: ${flatDetails.trim() || 'N/A'}, Location: ${locationAddress.trim()}`;

    if (validMedicines.length === 0 || !userName.trim() || !mobile.trim() || !locationAddress.trim()) {
      Alert.alert("Error", "Please fill all required details (Medicine, Name, Mobile, and Location).");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to submit a request.");
      return;
    }

    setIsLoading(true);
    try {
      const orderId = await createCustomOrder({
        medicines: validMedicines,
        userName,
        mobile,
        address: finalAddress,
        userId: user.uid,
      });
      navigation.replace('CustomOrderProcessing', { orderId });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Request Medicine" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Can't find your medicine? Add them below and we'll search nearby medical stores for you.
          </Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Medicines</Text>
            {medicines.map((med, index) => (
              <View key={index} style={styles.medicineRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label={`Medicine ${index + 1}`}
                    placeholder={`Medicine name ${index + 1}`}
                    value={med}
                    onChangeText={(text) => handleMedicineChange(text, index)}
                    containerStyle={styles.medicineInputContainer}
                  />
                </View>
                {medicines.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveMedicine(index)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={20} color={themeColors.status.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddMedicine}>
              <Ionicons name="add-circle-outline" size={20} color={themeColors.brand.primary} />
              <Text style={[styles.addMoreText, { color: themeColors.brand.primary }]}>Add More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Contact Info</Text>
            <TextInput
              label="Your Name"
              placeholder="Enter your name"
              value={userName}
              onChangeText={setUserName}
              containerStyle={styles.inputContainer}
            />
            <TextInput
              label="Mobile Number"
              placeholder="Enter mobile number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              containerStyle={styles.inputContainer}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Delivery Address</Text>
            
            <TouchableOpacity 
              style={[styles.locationBtn, { borderColor: themeColors.brand.primary, backgroundColor: themeColors.brand.primary + '10' }]} 
              onPress={handleGetLocation}
              disabled={isFetchingLocation}
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={themeColors.brand.primary} />
              ) : (
                <Ionicons name="location-outline" size={20} color={themeColors.brand.primary} />
              )}
              <Text style={[styles.locationBtnText, { color: themeColors.brand.primary }]}>
                {isFetchingLocation ? 'Fetching location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            <TextInput
              label="Location / Building Name"
              placeholder="Current Location / Building Name"
              value={locationAddress}
              onChangeText={setLocationAddress}
              multiline
              numberOfLines={2}
              containerStyle={styles.inputContainer}
            />

            <TextInput
              label="Flat / Floor details"
              placeholder="Flat No, Floor, Tower No (Optional)"
              value={flatDetails}
              onChangeText={setFlatDetails}
              containerStyle={styles.inputContainer}
            />
          </View>

        </ScrollView>
        <View style={[styles.footer, { borderTopColor: themeColors.border.default, backgroundColor: themeColors.background.primary }]}>
            <Button
              title="Submit Request"
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitBtn}
            />
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  medicineInputContainer: {
    marginBottom: 0,
  },
  removeBtn: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  addMoreText: {
    ...typography.bodyStrong,
    marginLeft: spacing.xs,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  locationBtnText: {
    ...typography.bodyStrong,
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  submitBtn: {
    width: '100%',
  }
});
