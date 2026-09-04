import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Switch, ActivityIndicator } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { useAddressStore } from '../../../store/useAddressStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'AddressManagement'>;

export const AddressManagementScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();

  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddressStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Detailed Form Fields
  const [selectedTag, setSelectedTag] = useState<'Home' | 'Work' | 'Parents' | 'Other'>('Home');
  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [cityState, setCityState] = useState('Bangalore, Karnataka');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setDetectedCoords({ latitude, longitude });

      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        setHouseNo(addr.streetNumber || '');
        setStreetArea(addr.street || addr.subregion || '');
        setLandmark(addr.name || '');
        setPincode(addr.postalCode || '');
        
        const city = addr.city || addr.subregion || addr.district || '';
        const region = addr.region || '';
        setCityState([city, region].filter(Boolean).join(', '));
      } else {
        Alert.alert('Location not found', 'Could not fetch address for your current location.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while fetching location.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveAddress = () => {
    if (!houseNo.trim() || !streetArea.trim() || !pincode.trim() || !receiverName.trim()) return;

    const fullFormattedText = `${houseNo.trim()}, ${streetArea.trim()}${landmark.trim() ? `, Near ${landmark.trim()}` : ''}, ${cityState.trim()} - ${pincode.trim()}`;
    const fullReceiver = `${receiverName.trim()} (+91 ${receiverPhone.trim() || '98765 43210'})`;

    const newAddressObj: any = {
      id: editingId ? editingId : Date.now().toString(),
      title: selectedTag,
      text: fullFormattedText,
      receiver: fullReceiver,
      isDefault: isDefault,
    };

    if (detectedCoords) {
      newAddressObj.latitude = detectedCoords.latitude;
      newAddressObj.longitude = detectedCoords.longitude;
      newAddressObj.coordinates = {
        latitude: detectedCoords.latitude,
        longitude: detectedCoords.longitude,
      };
    }

    if (editingId) {
      updateAddress(editingId, newAddressObj);
    } else {
      addAddress(newAddressObj);
    }

    // Reset Form
    setHouseNo('');
    setStreetArea('');
    setLandmark('');
    setPincode('');
    setReceiverName('');
    setReceiverPhone('');
    setIsDefault(false);
    setDetectedCoords(null);
    setEditingId(null);
    setModalVisible(false);
  };

  const handleEdit = (addr: any) => {
    // Basic parse logic for pre-fill
    const receiverParts = addr.receiver.split(' (+91 ');
    setReceiverName(receiverParts[0]);
    if (receiverParts[1]) setReceiverPhone(receiverParts[1].replace(')', ''));

    const addrParts = addr.text.split(', ');
    setHouseNo(addrParts[0] || '');
    setStreetArea(addrParts[1]?.replace(/ Near .*/, '') || '');
    setLandmark(addrParts[1]?.includes(' Near ') ? addrParts[1].split(' Near ')[1] : '');
    const cityStatePin = addrParts[addrParts.length - 1] || '';
    const pinMatch = cityStatePin.match(/\d{6}/);
    setPincode(pinMatch ? pinMatch[0] : '');
    setCityState(cityStatePin.replace(/ - \d{6}/, ''));

    setSelectedTag(addr.title as any);
    setIsDefault(addr.isDefault);
    setEditingId(addr.id);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress(id) },
    ]);
  };

  const setDefault = (id: string) => {
    setDefaultAddress(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Saved Addresses</Text>
        <TouchableOpacity onPress={() => { setEditingId(null); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={themeColors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {addresses.map((addr) => (
          <Card key={addr.id} style={styles.card}>
            <View style={styles.row}>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', gap: spacing.md }} onPress={() => setDefault(addr.id)}>
                <Ionicons name="location-outline" size={24} color={themeColors.brand.primary} />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.addrTitle, { color: themeColors.text.primary }]}>{addr.title}</Text>
                    {addr.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                        <Text style={[styles.defaultText, { color: themeColors.brand.primary }]}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.addrText, { color: themeColors.text.primary }]}>{addr.text}</Text>
                  {!!addr.receiver && (
                    <Text style={[styles.receiverText, { color: themeColors.text.secondary }]}>👤 {addr.receiver}</Text>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleEdit(addr)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={20} color={themeColors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(addr.id)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Detailed Address Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>{editingId ? 'Edit' : 'Add'} Detailed Address</Text>
              <TouchableOpacity onPress={() => { setEditingId(null); setModalVisible(false); }}>
                <Ionicons name="close" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Detect Location Action Button */}
            <TouchableOpacity 
              style={[styles.detectBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: themeColors.brand.primary }]}
              onPress={handleDetectLocation}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <ActivityIndicator color={themeColors.brand.primary} />
              ) : (
                <>
                  <Ionicons name="locate" size={20} color={themeColors.brand.primary} />
                  <Text style={[styles.detectBtnText, { color: themeColors.brand.primary }]}>
                    Detect Current GPS Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 400 }}>
              {/* Tag Selector */}
              <Text style={[styles.fieldLabel, { color: themeColors.text.secondary }]}>Save Address As</Text>
              <View style={styles.tagRow}>
                {(['Home', 'Work', 'Parents', 'Other'] as const).map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      { borderColor: themeColors.border.default, backgroundColor: themeColors.background.secondary },
                      selectedTag === tag && { backgroundColor: themeColors.brand.primary, borderColor: themeColors.brand.primary }
                    ]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text style={[styles.tagChipText, { color: selectedTag === tag ? '#FFFFFF' : themeColors.text.primary }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                label="Flat / House / Building No."
                placeholder="e.g. Flat 4B, Rosewood Apts"
                value={houseNo}
                onChangeText={setHouseNo}
              />

              <TextInput
                label="Street / Area / Locality"
                placeholder="e.g. 12th Main, 4th Block, Koramangala"
                value={streetArea}
                onChangeText={setStreetArea}
              />

              <TextInput
                label="Landmark (Optional)"
                placeholder="e.g. Near Sony World Signal"
                value={landmark}
                onChangeText={setLandmark}
              />

              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <TextInput
                  label="Pincode"
                  placeholder="e.g. 560034"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                  containerStyle={{ flex: 1 }}
                />
                <TextInput
                  label="City / State"
                  placeholder="Bangalore, KA"
                  value={cityState}
                  onChangeText={setCityState}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <TextInput
                label="Receiver Name"
                placeholder="e.g. Arun Kumar"
                value={receiverName}
                onChangeText={setReceiverName}
              />

              <TextInput
                label="Receiver Phone Number"
                placeholder="e.g. 9876543210"
                value={receiverPhone}
                onChangeText={setReceiverPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <View style={[styles.switchRow, { borderTopColor: themeColors.border.default }]}>
                <Text style={[styles.switchLabel, { color: themeColors.text.primary }]}>Set as Default Delivery Address</Text>
                <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ false: themeColors.border.default, true: themeColors.brand.primary }} />
              </View>
            </ScrollView>

            <Button title={editingId ? 'Update Address' : 'Save Detailed Address'} onPress={handleSaveAddress} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
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
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addrTitle: { ...typography.bodyStrong },
  defaultBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultText: { ...typography.caption, fontWeight: 'bold', fontSize: 10 },
  addrText: { ...typography.body, marginTop: 4 },
  receiverText: { ...typography.caption, marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: spacing.sm, marginLeft: spacing.sm },
  iconBtn: { padding: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2 },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detectBtnText: {
    ...typography.bodyStrong,
  },
  fieldLabel: { ...typography.caption, marginBottom: spacing.xs },
  tagRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xl,
    borderWidth: 1,
  },
  tagChipText: { ...typography.caption, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  switchLabel: { ...typography.body },
});
