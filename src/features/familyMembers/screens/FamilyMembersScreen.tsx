import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'FamilyMembers'>;

export const FamilyMembersScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();
  const [family, setFamily] = useState([
    { id: '1', name: 'Sunita Kumar', relation: 'Spouse', age: 28 },
    { id: '2', name: 'Ramesh Kumar', relation: 'Father', age: 62 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [age, setAge] = useState('');

  const handleSaveMember = () => {
    if (!name.trim() || !relation.trim()) return;
    const newMember = {
      id: Date.now().toString(),
      name: name.trim(),
      relation: relation.trim(),
      age: parseInt(age) || 30,
    };
    setFamily((prev) => [...prev, newMember]);
    setName('');
    setRelation('');
    setAge('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Family Members</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={24} color={themeColors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {family.map((member) => (
          <Card key={member.id} style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="person-circle-outline" size={40} color={themeColors.brand.primary} />
              <View>
                <Text style={[styles.name, { color: themeColors.text.primary }]}>{member.name}</Text>
                <Text style={[styles.sub, { color: themeColors.text.secondary }]}>{member.relation} • {member.age} yrs</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Add Family Member Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Full Name"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              label="Relationship"
              placeholder="e.g. Daughter, Mother, Spouse"
              value={relation}
              onChangeText={setRelation}
            />

            <TextInput
              label="Age"
              placeholder="e.g. 24"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />

            <Button title="Save Family Member" onPress={handleSaveMember} style={{ marginTop: spacing.md }} />
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
  name: { ...typography.bodyStrong },
  sub: { ...typography.caption, marginTop: 2 },
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
