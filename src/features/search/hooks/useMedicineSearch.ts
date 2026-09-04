import { useState, useEffect } from 'react';
import { searchMedicines } from '../../../services/firebase/medicines';
import { MedicineItem } from '../../../data/medicineCatalog';

export const useMedicineSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const clean = query.trim();
    if (!clean) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await searchMedicines(clean);
        if (active) {
          setResults(res);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setLoading(false);
        }
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
  };
};
