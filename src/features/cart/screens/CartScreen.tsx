import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../../store/useCartStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import * as ImagePicker from 'expo-image-picker';
import { CloudinaryService } from '../../../services/cloudinary/cloudinary';
type Props = NativeStackScreenProps<MainStackParamList>;

export const CartScreen = ({ navigation }: Props) => {
  const { cartItems, updateQty, addItem, prescriptionOption, setPrescriptionOption, prescriptionUrl, setPrescriptionUrl } = useCartStore();
  const themeColors = useThemeColors();

  const [customMedName, setCustomMedName] = useState('');
  const [customMedImage, setCustomMedImage] = useState<string | null>(null);
  
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);

  const hasRxRequired = cartItems.some((item) => item.rxRequired);

  const pickCustomMedImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      setIsUploadingCustom(true);
      try {
        const cloudinaryUrl = await CloudinaryService.uploadImage(result.assets[0].uri);
        setCustomMedImage(cloudinaryUrl);
      } catch (error) {
        console.error("Failed to upload custom medicine image:", error);
      } finally {
        setIsUploadingCustom(false);
      }
    }
  };

  const handleAddCustomMed = () => {
    if (!customMedName.trim() && !customMedImage) return;

    addItem({
      id: `custom_${Date.now()}`,
      name: customMedName.trim() || 'Custom Order (Image)',
      qty: 1,
      unitPrice: 0,
      rxRequired: false,
      isCustom: true,
      imageUrl: customMedImage,
    });
    setCustomMedName('');
    setCustomMedImage(null);
  };

  const pickPrescriptionImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      setIsUploadingRx(true);
      try {
        const cloudinaryUrl = await CloudinaryService.uploadImage(result.assets[0].uri);
        setPrescriptionUrl(cloudinaryUrl);
      } catch (error) {
        console.error("Failed to upload prescription image:", error);
      } finally {
        setIsUploadingRx(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>My Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={themeColors.text.secondary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text.primary }]}>Your Cart is Empty</Text>
            <Text style={[styles.emptySub, { color: themeColors.text.secondary }]}>Add medicines from search or home to proceed.</Text>
            <Button
              title="Browse Medicines"
              onPress={() => navigation.navigate('Tabs')}
              style={styles.browseBtn}
            />
          </View>
        ) : (
          <>
            {/* CART ITEMS LIST */}
            {cartItems.map((item) => (
              <View key={item.id} style={[styles.cartItem, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
                {item.isCustom && item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.customItemImage} />
                )}
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text.primary }]}>{item.name}</Text>
                  {item.rxRequired && (
                    <View style={styles.rxBadge}>
                      <Text style={styles.rxText}>Prescription Needed</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.qtyContainer, { backgroundColor: themeColors.background.primary, borderColor: themeColors.border.default }]}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                    <Ionicons name="remove" size={16} color={themeColors.brand.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: themeColors.text.primary }]}>{item.qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                    <Ionicons name="add" size={16} color={themeColors.brand.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* MANUAL ORDER SECTION */}
            <View style={[styles.sectionCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Manual Order</Text>
              <Text style={[styles.sectionDesc, { color: themeColors.text.secondary }]}>
                Can't find your medicine? Write the name or upload a photo of it.
              </Text>
              
              <View style={styles.manualInputRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Medicine Name"
                    placeholder="Enter medicine name..."
                    value={customMedName}
                    onChangeText={setCustomMedName}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                <TouchableOpacity 
                  onPress={pickCustomMedImage}
                  disabled={isUploadingCustom}
                  style={[
                    styles.iconBtn, 
                    { 
                      backgroundColor: themeColors.background.primary, 
                      borderColor: customMedImage ? themeColors.brand.primary : themeColors.border.default 
                    }
                  ]}
                >
                  {isUploadingCustom ? (
                    <ActivityIndicator size="small" color={themeColors.brand.primary} />
                  ) : (
                    <Ionicons 
                      name={customMedImage ? "checkmark-circle" : "camera-outline"} 
                      size={24} 
                      color={customMedImage ? themeColors.brand.primary : themeColors.text.secondary} 
                    />
                  )}
                </TouchableOpacity>
              </View>

              {customMedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: customMedImage }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => setCustomMedImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              <Button 
                title="Add to Cart" 
                onPress={handleAddCustomMed} 
                disabled={!customMedName.trim() && !customMedImage}
                style={styles.addCustomBtn}
                variant="outline"
              />
            </View>

            {/* PRESCRIPTION SECTION */}
            {hasRxRequired && (
              <View style={[styles.sectionCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Prescription Required</Text>
                <Text style={[styles.sectionDesc, { color: themeColors.text.secondary }]}>
                  Some medicines in your cart require a valid doctor's prescription.
                </Text>

                <TouchableOpacity 
                  style={[
                    styles.radioOption, 
                    { borderColor: prescriptionOption === 'upload' ? themeColors.brand.primary : themeColors.border.default }
                  ]}
                  onPress={() => setPrescriptionOption('upload')}
                >
                  <Ionicons name={prescriptionOption === 'upload' ? "radio-button-on" : "radio-button-off"} size={20} color={prescriptionOption === 'upload' ? themeColors.brand.primary : themeColors.text.secondary} />
                  <Text style={[styles.radioText, { color: themeColors.text.primary }]}>Upload Prescription</Text>
                </TouchableOpacity>

                {prescriptionOption === 'upload' && (
                  <View style={styles.uploadRxContainer}>
                    {prescriptionUrl ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: prescriptionUrl }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeImageBtn}
                          onPress={() => setPrescriptionUrl(null)}
                        >
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.uploadRxBtn, { borderColor: themeColors.brand.primary }]} 
                        onPress={pickPrescriptionImage}
                        disabled={isUploadingRx}
                      >
                        {isUploadingRx ? (
                          <ActivityIndicator size="small" color={themeColors.brand.primary} />
                        ) : (
                          <Ionicons name="cloud-upload-outline" size={24} color={themeColors.brand.primary} />
                        )}
                        <Text style={[styles.uploadRxText, { color: themeColors.brand.primary }]}>
                          {isUploadingRx ? "Uploading..." : "Select Image"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity 
                  style={[
                    styles.radioOption, 
                    { borderColor: prescriptionOption === 'contact_doctor' ? themeColors.brand.primary : themeColors.border.default, marginTop: spacing.sm }
                  ]}
                  onPress={() => setPrescriptionOption('contact_doctor')}
                >
                  <Ionicons name={prescriptionOption === 'contact_doctor' ? "radio-button-on" : "radio-button-off"} size={20} color={prescriptionOption === 'contact_doctor' ? themeColors.brand.primary : themeColors.text.secondary} />
                  <Text style={[styles.radioText, { color: themeColors.text.primary }]}>Contact Doctor for Prescription</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
          <Button
            title="Proceed to Checkout"
            onPress={() => navigation.navigate('Checkout')}
            disabled={hasRxRequired && (!prescriptionOption || (prescriptionOption === 'upload' && !prescriptionUrl))}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h2,
  },
  content: {
    padding: spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  customItemImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyStrong,
  },
  rxBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  rxText: {
    ...typography.caption,
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.sm,
    borderWidth: 1,
  },
  qtyBtn: {
    padding: spacing.xs,
  },
  qtyText: {
    ...typography.bodyStrong,
    paddingHorizontal: spacing.sm,
  },
  sectionCard: {
    padding: spacing.lg,
    borderRadius: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: 4,
  },
  sectionDesc: {
    ...typography.body,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 18,
  },
  imagePreviewContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
  addCustomBtn: {
    marginTop: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    gap: spacing.sm,
  },
  radioText: {
    ...typography.bodyStrong,
  },
  uploadRxContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  uploadRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  uploadRxText: {
    ...typography.bodyStrong,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.md,
  },
  emptySub: {
    ...typography.body,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  browseBtn: {
    width: 200,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderTopWidth: 1,
  },
});

