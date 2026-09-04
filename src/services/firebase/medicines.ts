import { collection, getDocs, writeBatch, doc, limit, query, getDoc } from 'firebase/firestore';
import { db } from './firestore';
import { MEDICINE_CATALOG, MedicineItem } from '../../data/medicineCatalog';

const COLLECTION_NAME = 'Medicinename';

let cachedMedicines: MedicineItem[] | null = null;
let isSeedingInProgress = false;

/**
 * Fetch all medicines from the 'Medicinename' collection in Firestore.
 * Falls back immediately to the pre-bundled catalog if offline or empty.
 */
export const fetchMedicines = async (): Promise<MedicineItem[]> => {
  if (cachedMedicines && cachedMedicines.length > 0) {
    return cachedMedicines;
  }

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);

    if (!snap.empty) {
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
      return items;
    }
  } catch (error) {
    console.warn('Firestore fetchMedicines notice (using local fallback):', error);
  }

  // Fallback to local catalog
  cachedMedicines = MEDICINE_CATALOG;
  return MEDICINE_CATALOG;
};

/**
 * Seed all 783 medicines into the 'Medicinename' Firestore collection.
 * Uses batched writes (max 400 per batch) for atomic execution.
 */
export const seedMedicinesToFirestore = async (force = false): Promise<{ success: boolean; count: number; error?: string }> => {
  if (isSeedingInProgress) {
    return { success: false, count: 0, error: 'Seeding already in progress' };
  }
  isSeedingInProgress = true;

  try {
    const colRef = collection(db, COLLECTION_NAME);
    
    if (!force) {
      const q = query(colRef, limit(1));
      const existing = await getDocs(q);
      if (!existing.empty && existing.size > 0) {
        console.log(`'${COLLECTION_NAME}' collection already has items. Skipping duplicate seeding.`);
        isSeedingInProgress = false;
        return { success: true, count: 0 };
      }
    }

    console.log(`Starting seeding of ${MEDICINE_CATALOG.length} medicines into '${COLLECTION_NAME}' collection...`);
    const batchSize = 400;
    let totalUploaded = 0;

    for (let i = 0; i < MEDICINE_CATALOG.length; i += batchSize) {
      const chunk = MEDICINE_CATALOG.slice(i, i + batchSize);
      const batch = writeBatch(db);

      for (const med of chunk) {
        const docRef = doc(db, COLLECTION_NAME, med.id);
        batch.set(docRef, {
          id: med.id,
          name: med.name,
          nameLower: med.nameLower,
          category: med.category,
          price: med.price,
          formattedPrice: med.formattedPrice,
          rxRequired: med.rxRequired,
          dosageForm: med.dosageForm,
          description: med.description,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      await batch.commit();
      totalUploaded += chunk.length;
      console.log(`Seeded batch ${i / batchSize + 1}: ${totalUploaded}/${MEDICINE_CATALOG.length} medicines.`);
    }

    cachedMedicines = MEDICINE_CATALOG;
    isSeedingInProgress = false;
    return { success: true, count: totalUploaded };
  } catch (error: any) {
    console.error('Error seeding medicines into Firestore:', error);
    isSeedingInProgress = false;
    return { success: false, count: 0, error: error?.message || String(error) };
  }
};

/**
 * High-performance search across medicines in 'Medicinename'.
 */
export const searchMedicines = async (
  queryText: string,
  maxResults = 25
): Promise<MedicineItem[]> => {
  const clean = queryText.trim().toLowerCase();
  if (!clean) return [];

  const list = await fetchMedicines();
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
 * Get suggestions for custom order input autocompletion.
 */
export const getMedicineSuggestions = async (
  prefix: string,
  limitCount = 6
): Promise<MedicineItem[]> => {
  const clean = prefix.trim().toLowerCase();
  if (!clean) return [];

  const list = await fetchMedicines();
  const filtered = list.filter((item) => item.nameLower.includes(clean));

  filtered.sort((a, b) => {
    const aStarts = a.nameLower.startsWith(clean);
    const bStarts = b.nameLower.startsWith(clean);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.length - b.name.length;
  });

  return filtered.slice(0, limitCount);
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
