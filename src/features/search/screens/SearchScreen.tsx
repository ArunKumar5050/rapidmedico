import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput } from '../../../components/ui/TextInput';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList>;

export const SearchScreen = ({ navigation }: Props) => {
  const [query, setQuery] = useState('');
  const themeColors = useThemeColors();

  const trendingSearches = [
    'Paracetamol 650mg',
    'Vitamin C Tablets',
    'Metformin 500mg',
    'Amoxicillin',
    'Cough Syrup',
    'Face Mask',
  ];

  const mockMedicines = [
    { id: '1', name: 'Dolo 650mg Tablet', category: 'Fever & Pain', price: '₹30.50', prescriptionRequired: false },
    { id: '2', name: 'Metformin 500mg', category: 'Diabetes Care', price: '₹45.00', prescriptionRequired: true },
    { id: '3', name: 'Aspirin 75mg', category: 'Cardiac Care', price: '₹22.00', prescriptionRequired: true },
    { id: '4', name: 'Cetzine 10mg', category: 'Allergy', price: '₹18.00', prescriptionRequired: false },
  ];

  const filteredMedicines = query.trim() 
    ? mockMedicines.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TextInput
          label=""
          placeholder="Search for medicines, wellness products..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          containerStyle={styles.searchInput}
        />
      </View>

      <ScrollView style={styles.content}>
        {query.trim().length === 0 ? (
          <View>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Trending Searches</Text>
            <View style={styles.tagContainer}>
              {trendingSearches.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.tag,
                    { 
                      backgroundColor: themeColors.background.secondary,
                      borderColor: themeColors.border.default,
                    }
                  ]}
                  onPress={() => setQuery(item)}
                >
                  <Ionicons name="trending-up" size={16} color={themeColors.brand.primary} style={styles.tagIcon} />
                  <Text style={[styles.tagText, { color: themeColors.text.primary }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Results ({filteredMedicines.length})</Text>
            {filteredMedicines.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={themeColors.text.secondary} />
                <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>No medicines found matching "{query}"</Text>
                <Button
                  title="Request Custom Order"
                  onPress={() => navigation.navigate('CustomOrderRequest', { initialMedicineName: query })}
                  style={styles.requestBtn}
                />
              </View>
            ) : (
              filteredMedicines.map((med) => (
                <Card key={med.id} style={styles.medCard}>
                  <TouchableOpacity 
                    style={styles.medCardInner}
                    onPress={() => navigation.navigate('MedicineDetail', { medicineId: med.id })}
                  >
                    <View style={styles.medInfo}>
                      <Text style={[styles.medName, { color: themeColors.text.primary }]}>{med.name}</Text>
                      <Text style={[styles.medCategory, { color: themeColors.text.secondary }]}>{med.category}</Text>
                      {med.prescriptionRequired && (
                        <View style={styles.rxBadge}>
                          <Text style={styles.rxText}>Rx Required</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.medAction}>
                      <Text style={[styles.medPrice, { color: themeColors.brand.primary }]}>{med.price}</Text>
                      <TouchableOpacity 
                        style={[styles.addBtn, { backgroundColor: themeColors.brand.primary }]}
                        onPress={() => navigation.navigate('Cart')}
                      >
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  searchInput: {
    marginBottom: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xl,
    borderWidth: 1,
  },
  tagIcon: {
    marginRight: spacing.xs,
  },
  tagText: {
    ...typography.body,
  },
  medCard: {
    marginBottom: spacing.md,
  },
  medCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    ...typography.bodyStrong,
  },
  medCategory: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  rxBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  rxText: {
    ...typography.caption,
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  medAction: {
    alignItems: 'flex-end',
  },
  medPrice: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  addBtnText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  requestBtn: {
    width: '100%',
  }
});
