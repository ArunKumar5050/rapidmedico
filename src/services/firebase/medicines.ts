import { collection, getDocs, writeBatch, doc, limit, query, getDoc } from 'firebase/firestore';
import { db } from './firestore';
import { MEDICINE_CATALOG, MedicineItem } from '../../data/medicineCatalog';

const COLLECTION_NAME = 'Medicinename';

// Pre-populate cache immediately with the bundled catalog for 0ms instant search
let cachedMedicines: MedicineItem[] = MEDICINE_CATALOG;
let isSeedingInProgress = false;
let isFirestoreSyncDone = false;

/**
 * Fetch all medicines. Returns in-memory catalog instantly (0ms latency).
 * Checks Firestore in background if not already synced.
 */
export const fetchMedicines = async (): Promise<MedicineItem[]> => {
  if (cachedMedicines && cachedMedicines.length > 0) {
    // Fire-and-forget background sync if not done yet
    if (!isFirestoreSyncDone) {
      isFirestoreSyncDone = true;
      syncWithFirestoreInBackground().catch(() => {});
    }
    return cachedMedicines;
  }
  return MEDICINE_CATALOG;
};

const syncWithFirestoreInBackground = async () => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    if (!snap.empty && snap.docs.length > 0) {
      const items: MedicineItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          nameLower: (data.nameLower || data.name || '').toLowerCase(),
          category: data.category || 'General Medicine',
          price: typeof data.price === 'number' ? data.price : 45,
          formattedPrice: data.formattedPrice || `₹${(data.price || 45).toFixed(2)}`,
          rxRequired: data.rxRequired ?? true,
          dosageForm: data.dosageForm || 'Medicine',
          description: data.description || '',
        };
      });
      cachedMedicines = items;
    }
  } catch (err) {
    console.warn('Background medicine sync notice:', err);
  }
};

/**
 * Instant synchronous search across medicines in memory (< 1ms execution).
 */
export const searchMedicinesSync = (
  queryText: string,
  maxResults = 30
): MedicineItem[] => {
  const clean = queryText.trim().toLowerCase();
  if (!clean) return [];

  const list = cachedMedicines && cachedMedicines.length > 0 ? cachedMedicines : MEDICINE_CATALOG;
  const searchTokens = clean.split(/\s+/).filter(Boolean);

  const matched = list.filter((item) => {
    // Exact or substring match
    if (item.nameLower.includes(clean)) return true;
    
    // Multi-token match: every search word must appear in the name
    return searchTokens.every((token) => item.nameLower.includes(token));
  });

  // Sort by closest match (starts with query > tokens match)
  matched.sort((a, b) => {
    const aStarts = a.nameLower.startsWith(clean);
    const bStarts = b.nameLower.startsWith(clean);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.length - b.name.length;
  });

  return matched.slice(0, maxResults);
};

/**
 * High-performance search across medicines (instant, non-blocking).
 */
export const searchMedicines = async (
  queryText: string,
  maxResults = 30
): Promise<MedicineItem[]> => {
  return searchMedicinesSync(queryText, maxResults);
};

/**
 * Get suggestions for custom order input autocompletion (instant).
 */
export const getMedicineSuggestions = async (
  prefix: string,
  limitCount = 6
): Promise<MedicineItem[]> => {
  return searchMedicinesSync(prefix, limitCount);
};

/**
 * Fetch a single medicine by its ID.
 */
export const getMedicineById = async (id: string): Promise<MedicineItem | null> => {
  if (cachedMedicines) {
    const found = cachedMedicines.find((m) => m.id === id);
    if (found) return found;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name,
        nameLower: (data.nameLower || data.name || '').toLowerCase(),
        category: data.category || 'General Medicine',
        price: data.price || 45,
        formattedPrice: data.formattedPrice || `₹${(data.price || 45).toFixed(2)}`,
        rxRequired: data.rxRequired ?? true,
        dosageForm: data.dosageForm || 'Medicine',
        description: data.description || '',
      };
    }
  } catch (e) {
    console.warn(`Error fetching medicine by ID ${id}:`, e);
  }

  return MEDICINE_CATALOG.find((m) => m.id === id) || null;
};
