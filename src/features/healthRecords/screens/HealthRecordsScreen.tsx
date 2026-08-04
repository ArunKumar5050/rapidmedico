import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'HealthRecords'>;

export const HealthRecordsScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();
  const [records, setRecords] = useState([
    { id: '1', title: 'Blood Test Report', date: '12 May 2026', type: 'Lab Report' },
    { id: '2', title: 'Penicillin Allergy', date: 'Recorded 2025', type: 'Allergy Warning' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');

  const handleSaveRecord = () => {
    if (!title.trim()) return;
    const newRec = {
      id: Date.now().toString(),
      title: title.trim(),
      type: type.trim() || 'Lab Report',
      date: 'Just Now',
    };
    setRecords((prev) => [...prev, newRec]);
    setTitle('');
    setType('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Health Records</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="cloud-upload-outline" size={24} color={themeColors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {records.map((rec) => (
          <Card key={rec.id} style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="document-text-outline" size={32} color={themeColors.brand.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.recTitle, { color: themeColors.text.primary }]}>{rec.title}</Text>
                <Text style={[styles.recSub, { color: themeColors.text.secondary }]}>{rec.type} • {rec.date}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Add Health Record Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>Upload Health Record</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Document / Report Title"
              placeholder="e.g. Lipid Profile Test"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              label="Record Category"
              placeholder="e.g. Lab Report, Prescription, Allergy"
              value={type}
              onChangeText={setType}
            />

            <Button title="Save Record" onPress={handleSaveRecord} style={{ marginTop: spacing.md }} />
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recTitle: { ...typography.bodyStrong },
  recSub: { ...typography.caption, marginTop: 2 },
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
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h2 },
});
