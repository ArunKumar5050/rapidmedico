import { create } from 'zustand';
import { saveDocument, deleteDocument, syncCollection } from '../services/firebase/firestoreHelpers';

export type Address = {
  id: string;
  title: string;
  text: string;
  receiver: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

interface AddressStore {
  addresses: Address[];
  addAddress: (address: Address) => void;
  updateAddress: (id: string, address: Address) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => Address | undefined;
  initSync: () => () => void;
}

import { useAuthStore } from './auth';

const getCollectionPath = () => {
  const user = useAuthStore.getState().user;
  const userId = user?.uid || 'demo_user_123';
  return `users/${userId}/addresses`;
};

const initialAddresses: Address[] = [];

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: initialAddresses,

  addAddress: (address: Address) => {
    const state = get();
    const path = getCollectionPath();
    let updatedAddresses = [...state.addresses];
    if (address.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => {
        const resetAddr = { ...a, isDefault: false };
        saveDocument(path, resetAddr);
        return resetAddr;
      });
    }
    if (updatedAddresses.length === 0) {
      address.isDefault = true;
    }
    saveDocument(path, address);
    set({ addresses: [...updatedAddresses, address] });
  },

  updateAddress: (id: string, address: Address) => {
    const state = get();
    const path = getCollectionPath();
    let updatedAddresses = [...state.addresses];
    
    if (address.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => {
        if (a.id === id) return a;
        const resetAddr = { ...a, isDefault: false };
        saveDocument(path, resetAddr);
        return resetAddr;
      });
    }
    
    updatedAddresses = updatedAddresses.map((a) => (a.id === id ? address : a));
    saveDocument(path, address);
    set({ addresses: updatedAddresses });
  },

  deleteAddress: (id: string) => {
    const state = get();
    const path = getCollectionPath();
    const updatedAddresses = state.addresses.filter(a => a.id !== id);
    if (updatedAddresses.length > 0 && !updatedAddresses.find(a => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
      saveDocument(path, updatedAddresses[0]);
    }
    deleteDocument(path, id);
    set({ addresses: updatedAddresses });
  },

  setDefaultAddress: (id: string) => {
    set((state) => {
      const path = getCollectionPath();
      const updated = state.addresses.map((a) => {
        const isDef = a.id === id;
        const updatedAddr = { ...a, isDefault: isDef };
        saveDocument(path, updatedAddr);
        return updatedAddr;
      });
      return { addresses: updated };
    });
  },

  getDefaultAddress: () => {
    const state = get();
    return state.addresses.find((a) => a.isDefault) || state.addresses[0];
  },

  initSync: () => {
    const path = getCollectionPath();
    const unsubscribe = syncCollection<Address>(path, (remoteAddresses) => {
      set({ addresses: remoteAddresses });
    });
    return unsubscribe;
  },
}));
