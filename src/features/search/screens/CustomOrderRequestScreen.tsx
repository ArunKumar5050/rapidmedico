import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { TextInput } from '../../../components/ui/TextInput';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { createCustomOrder } from '../../../services/firebase/customOrders';
import { getMedicineSuggestions } from '../../../services/firebase/medicines';
import { MedicineItem } from '../../../data/medicineCatalog';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { CloudinaryService } from '../../../services/cloudinary/cloudinary';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderRequest'>;

export const CustomOrderRequestScreen = ({ navigation, route }: Props) => {
  const { initialMedicineName = '', initialImageUrl = null, initialDescription = '' } = route.params || {};
  const themeColors = useThemeColors();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState(initialImageUrl ? 2 : 1);
  const [medicines, setMedicines] = useState<{name: string, image: string | null}[]>([
    { name: initialMedicineName || initialDescription, image: initialImageUrl }
  ]);
  const [userName, setUserName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.phone || '');
  
  // Suggestion state
  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<MedicineItem[]>([]);

  // Address states
  const [locationAddress, setLocationAddress] = useState('');
  const [flatDetails, setFlatDetails] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  // Sync initial medicine when passed via route params
  useEffect(() => {
    if (initialMedicineName) {
      setMedicines(prev => {
        if (prev.length === 1 && !prev[0].name.trim() && !prev[0].image) {
          return [{ name: initialMedicineName, image: null }];
        }
        if (prev.some(m => m.name.trim().toLowerCase() === initialMedicineName.trim().toLowerCase())) {
          return prev;
        }
        const emptyIdx = prev.findIndex(m => !m.name.trim() && !m.image);
        if (emptyIdx !== -1) {
          const updated = [...prev];
          updated[emptyIdx] = { name: initialMedicineName, image: null };
          return updated;
        }
        return [...prev, { name: initialMedicineName, image: null }];
      });
      setStep(1);
    }
  }, [initialMedicineName]);

  const handleAddMedicine = () => {
    setActiveSuggestionRow(null);
    setSuggestions([]);
    setMedicines([...medicines, { name: '', image: null }]);
  };

  const handleMedicineChange = async (text: string, index: number) => {
    const newMedicines = [...medicines];
    newMedicines[index].name = text;
    setMedicines(newMedicines);

    const clean = text.trim();
    if (clean.length >= 2) {
      try {
        const matches = await getMedicineSuggestions(clean, 6);
        setSuggestions(matches);
        setActiveSuggestionRow(index);
      } catch (e) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setActiveSuggestionRow(null);
    }
  };

  const handleSelectSuggestion = (index: number, medName: string) => {
    const newMedicines = [...medicines];
    newMedicines[index].name = medName;
    setMedicines(newMedicines);
    setSuggestions([]);
    setActiveSuggestionRow(null);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length > 1) {
      const newMedicines = [...medicines];
      newMedicines.splice(index, 1);
      setMedicines(newMedicines);
      if (activeSuggestionRow === index) {
        setActiveSuggestionRow(null);
        setSuggestions([]);
      }
    }
  };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const newMedicines = [...medicines];
      newMedicines[index].image = result.assets[0].uri;
      setMedicines(newMedicines);
    }
  };

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        setIsFetchingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCoordinates({ latitude, longitude });

      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const addressParts = [place.name, place.street, place.subregion, place.city, place.postalCode].filter(Boolean);
        setLocationAddress(addressParts.join(', '));
      } else {
        setLocationAddress(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const valid = medicines.some(m => m.name.trim().length > 0 || m.image);
      if (!valid) {
        Alert.alert('Error', 'Please enter at least one medicine or upload an image.');
        return;
      }
    }
    if (step === 2) {
      if (!userName.trim() || !mobile.trim()) {
        Alert.alert('Error', 'Please enter your name and mobile number.');
        return;
      }
    }
    setActiveSuggestionRow(null);
    setSuggestions([]);
    setStep(s => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setActiveSuggestionRow(null);
    setSuggestions([]);
    if (step > 1) {
      setStep(s => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    const validMedicines = medicines.filter(m => m.name.trim().length > 0 || m.image);
    const finalAddress = `Flat/Floor: ${flatDetails.trim() || 'N/A'}, Location: ${locationAddress.trim()}`;

    if (!locationAddress.trim()) {
      Alert.alert("Error", "Please provide a delivery location.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to submit a request.");
      return;
    }

    setIsLoading(true);
    try {
      const uploadedImageUrls: string[] = [];
      const processedMeds = [];

      for (const m of medicines) {
        if (m.name.trim().length > 0 || m.image) {
          if (m.image) {
            const url = await CloudinaryService.uploadImage(m.image);
            uploadedImageUrls.push(url);
          }
          processedMeds.push(m);
        }
      }

      const orderPayload: any = {
        medicines: processedMeds.map(m => m.name || 'Image Uploaded'),
        imageUrls: uploadedImageUrls,
        userName,
        mobile,
        address: finalAddress,
        userId: user.uid,
      };

      // Save exact GPS coordinates to database
      if (coordinates) {
        orderPayload.latitude = coordinates.latitude;
        orderPayload.longitude = coordinates.longitude;
        orderPayload.customerLat = coordinates.latitude;
        orderPayload.customerLng = coordinates.longitude;
        orderPayload.userLat = coordinates.latitude;
        orderPayload.userLng = coordinates.longitude;
        orderPayload.location = {
          lat: coordinates.latitude,
          lng: coordinates.longitude,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          timestamp: Date.now()
        };
        orderPayload.coordinates = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        };
      }

      const orderId = await createCustomOrder(orderPayload);
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
      <Header title={`Request Medicine (Step ${step}/3)`} showBack onBack={handleBack} />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%`, backgroundColor: themeColors.brand.primary }]} />
      </View>

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
          {step === 1 && (
            <View style={styles.section}>
              <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
                Can't find your medicine? Start typing for instant suggestions from our 750+ database, or upload a photo.
              </Text>
              
              <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Medicines List</Text>
              
              {medicines.map((med, index) => {
                const isThisRowActive = activeSuggestionRow === index && suggestions.length > 0;
                return (
                  <View key={index} style={styles.medicineRowWrapper}>
                    <View style={styles.medicineRow}>
                      <View style={{ flex: 1 }}>
                        <TextInput
                          label={`Medicine ${index + 1}`}
                          placeholder="Type medicine name (e.g. AMOXYCLAV...)"
                          value={med.name}
                          onChangeText={(text) => handleMedicineChange(text, index)}
                          onFocus={() => {
                            if (med.name.trim().length >= 2) {
                              getMedicineSuggestions(med.name.trim(), 6).then(res => {
                                setSuggestions(res);
                                setActiveSuggestionRow(index);
                              });
                            }
                          }}
                          containerStyle={styles.medicineInputContainer}
                        />
                      </View>

                      <TouchableOpacity 
                        onPress={() => pickImage(index)} 
                        style={[
                          styles.iconBtn, 
                          { 
                            backgroundColor: themeColors.background.secondary, 
                            borderColor: med.image ? themeColors.brand.primary : themeColors.border.default 
                          }
                        ]}
                      >
                        <Ionicons 
                          name={med.image ? "checkmark-circle" : "camera-outline"} 
                          size={22} 
                          color={med.image ? themeColors.brand.primary : themeColors.text.secondary} 
                        />
                      </TouchableOpacity>

                      {medicines.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveMedicine(index)} style={styles.removeBtn}>
                          <Ionicons name="trash-outline" size={20} color={themeColors.status.error} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Auto-Suggestion Dropdown */}
                    {isThisRowActive && (
                      <View style={[styles.suggestionsDropdown, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
                        <View style={styles.suggestionsHeader}>
                          <Ionicons name="flash-outline" size={13} color={themeColors.brand.primary} />
                          <Text style={[styles.suggestionsHeaderText, { color: themeColors.text.secondary }]}>
                            Database Suggestions
                          </Text>
                        </View>
                        {suggestions.map((sug) => (
                          <TouchableOpacity
                            key={sug.id}
                            style={[styles.suggestionItem, { borderBottomColor: themeColors.border.default }]}
                            onPress={() => handleSelectSuggestion(index, sug.name)}
                          >
                            <View style={styles.suggestionLeft}>
                              <Ionicons name="medical" size={16} color={themeColors.brand.primary} style={{ marginRight: 8 }} />
                              <Text style={[styles.suggestionName, { color: themeColors.text.primary }]}>
                                {sug.name}
                              </Text>
                            </View>
                            <View style={[styles.suggestionCategoryChip, { backgroundColor: themeColors.brand.primary + '15' }]}>
                              <Text style={[styles.suggestionCategoryText, { color: themeColors.brand.primary }]}>
                                {sug.category.split(' ')[0]}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {med.image && (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: med.image }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeImageBtn}
                          onPress={() => {
                            const newMeds = [...medicines];
                            newMeds[index].image = null;
                            setMedicines(newMeds);
                          }}
                        >
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddMedicine}>
                <Ionicons name="add-circle" size={22} color={themeColors.brand.primary} />
                <Text style={[styles.addMoreText, { color: themeColors.brand.primary }]}>Add Another Medicine</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Contact Info</Text>
              <TextInput
                label="Your Name"
                placeholder="Enter your full name"
                value={userName}
                onChangeText={setUserName}
                containerStyle={styles.inputContainer}
              />
              <TextInput
                label="Mobile Number"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Delivery Address</Text>
              
              <TouchableOpacity 
                style={[styles.locationBtn, { borderColor: themeColors.brand.primary, backgroundColor: themeColors.brand.primary + '12' }]} 
                onPress={handleGetLocation}
                disabled={isFetchingLocation}
              >
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color={themeColors.brand.primary} />
                ) : (
                  <Ionicons name="navigate" size={18} color={themeColors.brand.primary} />
                )}
                <Text style={[styles.locationBtnText, { color: themeColors.brand.primary }]}>
                  {isFetchingLocation ? 'Fetching GPS location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>

              {coordinates && (
                <View style={[styles.gpsBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: themeColors.status.success }]}>
                  <Ionicons name="checkmark-circle" size={16} color={themeColors.status.success} />
                  <Text style={[styles.gpsBadgeText, { color: themeColors.status.success }]}>
                    GPS coordinates pinned ({coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)})
                  </Text>
                </View>
              )}

              <TextInput
                label="Location / Area / Landmark"
                placeholder="Area, Street, Landmark"
                value={locationAddress}
                onChangeText={setLocationAddress}
                multiline
                numberOfLines={2}
                containerStyle={styles.inputContainer}
              />

              <TextInput
                label="Flat / House / Floor (Optional)"
                placeholder="Flat No, House Name, Floor No"
                value={flatDetails}
                onChangeText={setFlatDetails}
                containerStyle={styles.inputContainer}
              />
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: themeColors.border.default, backgroundColor: themeColors.background.primary }]}>
          {step < 3 ? (
            <Button title="Continue" onPress={handleNext} style={styles.submitBtn} />
          ) : (
            <Button
              title="Submit Custom Request"
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitBtn}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  content: {
    padding: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  medicineRowWrapper: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medicineInputContainer: {
    marginBottom: 0,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 18,
  },
  removeBtn: {
    padding: spacing.sm,
    marginTop: 18,
  },
  suggestionsDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: spacing.sm,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 4,
  },
  suggestionsHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 0.5,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  suggestionName: {
    ...typography.bodyStrong,
    fontSize: 13,
    flex: 1,
  },
  suggestionCategoryChip: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suggestionCategoryText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    marginTop: spacing.sm,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: spacing.sm,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  addMoreText: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  locationBtnText: {
    ...typography.bodyStrong,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  gpsBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  submitBtn: {
    width: '100%',
  }
});
