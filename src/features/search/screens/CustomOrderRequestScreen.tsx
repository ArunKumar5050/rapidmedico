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
import { useCartStore } from '../../../store/useCartStore';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderRequest'>;

export const CustomOrderRequestScreen = ({ navigation, route }: Props) => {
  const { initialMedicineName = '', initialImageUrl = null, initialDescription = '' } = route.params || {};
  const themeColors = useThemeColors();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  
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

  const [uploadingImageIndexes, setUploadingImageIndexes] = useState<number[]>([]);

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploadingImageIndexes((prev) => [...prev, index]);
      try {
        const cloudinaryUrl = await CloudinaryService.uploadImage(result.assets[0].uri);
        const newMedicines = [...medicines];
        newMedicines[index].image = cloudinaryUrl;
        setMedicines(newMedicines);
      } catch (error) {
        console.error("Failed to upload image:", error);
      } finally {
        setUploadingImageIndexes((prev) => prev.filter((i) => i !== index));
      }
    }
  };

  const handleAddItemsToCart = async () => {
    const validMedicines = medicines.filter(m => m.name.trim().length > 0 || m.image);
    
    if (validMedicines.length === 0) {
      Alert.alert('Error', 'Please enter at least one medicine or upload an image.');
      return;
    }

    setIsLoading(true);
    try {
      for (let i = 0; i < validMedicines.length; i++) {
        const m = validMedicines[i];
        let url = m.image;
        if (url && url.startsWith('file://')) {
          url = await CloudinaryService.uploadImage(url);
        }
        
        addItem({
          id: `custom_${Date.now()}_${i}`,
          name: m.name || 'Image Uploaded',
          qty: 1,
          unitPrice: 0,
          rxRequired: false,
          isCustom: true,
          imageUrl: url
        });
      }
      
      navigation.replace('Cart');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add items to cart.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setActiveSuggestionRow(null);
    setSuggestions([]);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Request Medicine" showBack onBack={handleBack} />

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
                        disabled={uploadingImageIndexes.includes(index)}
                        style={[
                          styles.iconBtn, 
                          { 
                            backgroundColor: themeColors.background.secondary, 
                            borderColor: med.image ? themeColors.brand.primary : themeColors.border.default 
                          }
                        ]}
                      >
                        {uploadingImageIndexes.includes(index) ? (
                          <ActivityIndicator size="small" color={themeColors.brand.primary} />
                        ) : (
                          <Ionicons 
                            name={med.image ? "checkmark-circle" : "camera-outline"} 
                            size={22} 
                            color={med.image ? themeColors.brand.primary : themeColors.text.secondary} 
                          />
                        )}
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

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: themeColors.border.default, backgroundColor: themeColors.background.primary }]}>
          <Button
            title="Add to Cart"
            onPress={handleAddItemsToCart}
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
