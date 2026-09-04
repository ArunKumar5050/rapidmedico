import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TextInput } from '../../../components/ui/TextInput';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { searchMedicines, fetchMedicines } from '../../../services/firebase/medicines';
import { MedicineItem, MEDICINE_CATALOG } from '../../../data/medicineCatalog';

type Props = NativeStackScreenProps<MainStackParamList>;

const CATEGORY_FILTERS = [
  'All',
  'Tablets',
  'Syrups & Suspensions',
  'Capsules',
  'Injections & Infusions',
  'Eye, Ear & Nasal Drops',
  'Ointments & Topicals',
  'Personal Care & Wellness'
];

const TRENDING_SEARCHES = [
  'AMOXYCLAV 625 TAB',
  'CHESTON COLD SYP',
  'PARACIP-650 TAB',
  'FERGLOW SYRUP',
  'OMEE CAP',
  'PODOCEF-200 TAB',
  'AZICIP 500',
  'PANTOSEC-DSR CAP',
  'SUMO SPRAY',
  'KETOKEM SOAP'
];

export const SearchScreen = ({ navigation }: Props) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchResults, setSearchResults] = useState<MedicineItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popularMedicines, setPopularMedicines] = useState<MedicineItem[]>([]);

  const themeColors = useThemeColors();

  // Initialize and load default/popular medicines on mount
  useEffect(() => {
    fetchMedicines().then((meds) => {
      setPopularMedicines(meds.slice(0, 15));
    });
  }, []);

  // Search medicines whenever query or category changes
  useEffect(() => {
    let isActive = true;
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchMedicines(cleanQuery, 40);
        if (isActive) {
          if (selectedCategory !== 'All') {
            setSearchResults(results.filter(r => r.category.toLowerCase().includes(selectedCategory.toLowerCase())));
          } else {
            setSearchResults(results);
          }
          setIsSearching(false);
        }
      } catch (err) {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }, 120);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [query, selectedCategory]);

  const handleSelectMedicine = (med: MedicineItem) => {
    navigation.navigate('CustomOrderRequest', { initialMedicineName: med.name });
  };

  const displayedList = useMemo(() => {
    if (query.trim().length > 0) {
      return searchResults;
    }
    if (selectedCategory !== 'All') {
      return MEDICINE_CATALOG.filter(m => m.category.toLowerCase().includes(selectedCategory.toLowerCase())).slice(0, 15);
    }
    return popularMedicines;
  }, [query, searchResults, selectedCategory, popularMedicines]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      {/* Header with Search Input */}
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <View style={styles.searchBarRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              label=""
              placeholder="Search 750+ medicines, tablets, syrups..."
              value={query}
              onChangeText={setQuery}
              autoFocus={false}
              containerStyle={styles.searchInput}
            />
          </View>
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color={themeColors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? themeColors.brand.primary : themeColors.background.primary,
                    borderColor: isSelected ? themeColors.brand.primary : themeColors.border.default,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected ? '#FFFFFF' : themeColors.text.primary,
                      fontWeight: isSelected ? '700' : '500',
                    }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={themeColors.brand.primary} />
            <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>Searching database...</Text>
          </View>
        )}

        {/* If query is empty and 'All' is selected, show trending searches */}
        {query.trim().length === 0 && selectedCategory === 'All' && (
          <View style={styles.trendingSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="flame" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Trending & Popular</Text>
            </View>
            <View style={styles.tagContainer}>
              {TRENDING_SEARCHES.map((item, index) => (
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
                  <Ionicons name="search-outline" size={14} color={themeColors.brand.primary} style={styles.tagIcon} />
                  <Text style={[styles.tagText, { color: themeColors.text.primary }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Results / List Section */}
        <View style={styles.resultsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {query.trim().length > 0
              ? `Results for "${query}" (${searchResults.length})`
              : selectedCategory !== 'All'
              ? `${selectedCategory} (${displayedList.length})`
              : 'Available Medicines'}
          </Text>

          {query.trim().length > 0 && searchResults.length === 0 && !isSearching ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={54} color={themeColors.text.secondary} />
              <Text style={[styles.emptyTitle, { color: themeColors.text.primary }]}>No Medicine Found</Text>
              <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
                We couldn't find "{query}" in our instant list. You can request it directly via Custom Order!
              </Text>
              <Button
                title="Request Custom Order"
                onPress={() => navigation.navigate('CustomOrderRequest', { initialMedicineName: query })}
                style={styles.requestBtn}
              />
            </View>
          ) : (
            displayedList.map((med) => {
              return (
                <Card key={med.id} style={styles.medCard}>
                  <TouchableOpacity 
                    style={styles.medCardInner}
                    activeOpacity={0.7}
                    onPress={() => handleSelectMedicine(med)}
                  >
                    <View style={styles.medIconBox}>
                      <Ionicons 
                        name={med.category.includes('Injection') ? 'shield-checkmark' : med.category.includes('Syrup') ? 'flask' : 'medical'} 
                        size={24} 
                        color={themeColors.brand.primary} 
                      />
                    </View>

                    <View style={styles.medInfo}>
                      <Text style={[styles.medName, { color: themeColors.text.primary }]} numberOfLines={2}>
                        {med.name}
                      </Text>
                      <Text style={[styles.medCategory, { color: themeColors.text.secondary }]}>
                        {med.category} • {med.dosageForm}
                      </Text>
                      
                      <View style={styles.badgeRow}>
                        {med.rxRequired && (
                          <View style={styles.rxBadge}>
                            <Text style={styles.rxText}>Rx Required</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.medAction}>
                      <TouchableOpacity 
                        style={[styles.addBtn, { backgroundColor: themeColors.brand.primary }]}
                        onPress={() => handleSelectMedicine(med)}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 2 }} />
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
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
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    marginBottom: spacing.xs,
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: spacing.xs,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.xl,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  categoryText: {
    ...typography.caption,
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
  },
  trendingSection: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: spacing.xl,
    borderWidth: 1,
  },
  tagIcon: {
    marginRight: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    fontSize: 12,
  },
  resultsSection: {
    marginTop: spacing.xs,
  },
  medCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  medCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medIconBox: {
    width: 44,
    height: 44,
    borderRadius: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  medCategory: {
    ...typography.caption,
    marginTop: 2,
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  rxBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rxText: {
    ...typography.caption,
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  medAction: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: spacing.sm,
  },
  addBtnText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 18,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  requestBtn: {
    width: '100%',
  },
});
