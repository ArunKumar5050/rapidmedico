import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import * as ImagePicker from 'expo-image-picker';
import { CloudinaryService } from '../../../services/cloudinary/cloudinary';

type Props = NativeStackScreenProps<MainStackParamList, 'PrescriptionUpload'>;

export const PrescriptionUploadScreen = ({ navigation }: Props) => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const themeColors = useThemeColors();

  const handleUpload = async (source: 'Camera' | 'Gallery') => {
    let result;
    if (source === 'Camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow gallery access to select a photo.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setIsUploading(true);
      try {
        const secureUrl = await CloudinaryService.uploadImage(uri);
        setUploadedUrl(secureUrl);
        Alert.alert('Success', 'Prescription attached successfully!');
      } catch (error) {
        Alert.alert('Upload Failed', 'There was an error uploading your prescription.');
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Upload Prescription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
          Upload a clear image of your doctor's prescription. Our pharmacist will verify and fulfill your order.
        </Text>

        <View style={styles.uploadOptions}>
          <TouchableOpacity 
            style={[styles.optionCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]} 
            onPress={() => handleUpload('Camera')}
            disabled={isUploading}
          >
            <Ionicons name="camera" size={36} color={themeColors.brand.primary} />
            <Text style={[styles.optionTitle, { color: themeColors.text.primary }]}>Take Photo</Text>
            <Text style={[styles.optionSub, { color: themeColors.text.secondary }]}>Use phone camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]} 
            onPress={() => handleUpload('Gallery')}
            disabled={isUploading}
          >
            <Ionicons name="images" size={36} color={themeColors.brand.primary} />
            <Text style={[styles.optionTitle, { color: themeColors.text.primary }]}>Gallery</Text>
            <Text style={[styles.optionSub, { color: themeColors.text.secondary }]}>Upload from files</Text>
          </TouchableOpacity>
        </View>

        {isUploading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={themeColors.brand.primary} />
            <Text style={[styles.loaderText, { color: themeColors.text.secondary }]}>Uploading to secure server...</Text>
          </View>
        )}

        {uploadedUrl && !isUploading && (
          <Card style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: themeColors.status.success, marginBottom: spacing.lg }}>
            <Ionicons name="checkmark-circle" size={24} color={themeColors.status.success} />
            <Text style={[styles.successText, { color: themeColors.status.success }]}>Prescription attached successfully</Text>
          </Card>
        )}

        <Card style={styles.guideCard}>
          <Text style={[styles.guideTitle, { color: themeColors.text.primary }]}>Valid Prescription Guide</Text>
          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={18} color={themeColors.status.success} />
            <Text style={[styles.guideText, { color: themeColors.text.secondary }]}>Doctor details & signature visible</Text>
          </View>
          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={18} color={themeColors.status.success} />
            <Text style={[styles.guideText, { color: themeColors.text.secondary }]}>Patient name & date legible</Text>
          </View>
          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={18} color={themeColors.status.success} />
            <Text style={[styles.guideText, { color: themeColors.text.secondary }]}>Medicines and dosage clearly written</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
        <Button
          title="Continue to Order"
          onPress={() => {
            // Ideally pass uploadedUrl to Cart/Checkout, but for now navigate
            navigation.navigate('Cart');
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  title: { ...typography.h2 },
  content: { padding: spacing.lg },
  subtitle: { ...typography.body, marginBottom: spacing.lg, lineHeight: 20 },
  uploadOptions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  optionCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  optionTitle: { ...typography.bodyStrong, marginTop: spacing.sm },
  optionSub: { ...typography.caption, marginTop: 2 },
  loaderContainer: { alignItems: 'center', marginBottom: spacing.lg },
  loaderText: { ...typography.body, marginTop: spacing.sm },
  successText: { ...typography.bodyStrong, flex: 1, marginLeft: spacing.sm },
  guideCard: { marginBottom: spacing.lg },
  guideTitle: { ...typography.bodyStrong, marginBottom: spacing.md },
  guideItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  guideText: { ...typography.body },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxxl, borderTopWidth: 1 },
});
