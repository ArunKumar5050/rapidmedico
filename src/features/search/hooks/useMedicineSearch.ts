import { useState, useEffect } from 'react';
import { searchMedicinesSync } from '../../../services/firebase/medicines';
import { MedicineItem } from '../../../data/medicineCatalog';

export const useMedicineSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clean = query.trim();
    if (!clean) {
      setResults([]);
      setLoading(false);
      return;
    }

    const res = searchMedicinesSync(clean);
    setResults(res);
    setLoading(false);
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
  };
};
