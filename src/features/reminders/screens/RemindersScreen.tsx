import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useReminderStore } from '../../../store/useReminderStore';

export const RemindersScreen = () => {
  const { reminders, addReminder, toggleReminder } = useReminderStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [medicine, setMedicine] = useState('');
  const [time, setTime] = useState('');
  const [dosage, setDosage] = useState('');
  const themeColors = useThemeColors();

  const handleSaveReminder = () => {
    if (!medicine.trim() || !time.trim()) return;
    const newRem = {
      id: Date.now().toString(),
      medicine: medicine.trim(),
      time: time.trim(),
      dosage: dosage.trim() || '1 Tablet',
      taken: false,
    };
    addReminder(newRem);
    setMedicine('');
    setTime('');
    setDosage('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Pill Reminders</Text>
        <TouchableOpacity style={styles.addReminderBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={themeColors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.dateHeader, { color: themeColors.text.primary }]}>Today's Schedule</Text>

        {reminders.map((item) => (
          <Card key={item.id} style={styles.reminderCard}>
            <View style={styles.cardRow}>
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={18} color={themeColors.brand.primary} />
                <Text style={[styles.timeText, { color: themeColors.brand.primary }]}>{item.time}</Text>
              </View>

              <TouchableOpacity 
                style={[
                  styles.checkbox, 
                  { borderColor: themeColors.border.default },
                  item.taken && { backgroundColor: themeColors.status.success, borderColor: themeColors.status.success }
                ]}
                onPress={() => toggleReminder(item.id)}
              >
                {item.taken && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.medicineName, { color: themeColors.text.primary }]}>{item.medicine}</Text>
            <Text style={[styles.dosageText, { color: themeColors.text.secondary }]}>{item.dosage}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* Add Pill Reminder Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>Add Pill Reminder</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Medicine Name"
              placeholder="e.g. Paracetamol 650mg"
              value={medicine}
              onChangeText={setMedicine}
            />

            <TextInput
              label="Reminder Time"
              placeholder="e.g. 09:30 AM"
              value={time}
              onChangeText={setTime}
            />

            <TextInput
              label="Dosage Instructions"
              placeholder="e.g. 1 Tablet after food"
              value={dosage}
              onChangeText={setDosage}
            />

            <Button title="Save Reminder" onPress={handleSaveReminder} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h1,
  },
  addReminderBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  dateHeader: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  reminderCard: {
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineName: {
    ...typography.bodyStrong,
  },
  dosageText: {
    ...typography.caption,
    marginTop: 2,
  },
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
  modalTitle: {
    ...typography.h2,
  },
});
