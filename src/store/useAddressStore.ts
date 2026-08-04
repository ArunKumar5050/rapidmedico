import { create } from 'zustand';
import { saveDocument, syncCollection } from '../services/firebase/firestoreHelpers';

export type Address = {
  id: string;
  title: string;
  text: string;
  receiver: string;
  isDefault: boolean;
};

interface AddressStore {
  addresses: Address[];
  addAddress: (address: Address) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => Address | undefined;
  initSync: () => () => void;
}

const COLLECTION_PATH = 'users/demo_user_123/addresses';

const initialAddresses: Address[] = [
  {
    id: '1',
    title: 'Home',
    text: 'Flat 4B, Sunflower Apts, 12th Main, Koramangala, Bangalore - 560034',
    receiver: 'Arun Kumar (+91 98765 43210)',
    isDefault: true,
  },
  {
    id: '2',
    title: 'Work',
    text: 'Tower B, 5th Floor, Tech Park, Indiranagar, Bangalore - 560038',
    receiver: 'Arun Kumar (+91 98765 43210)',
    isDefault: false,
  },
];

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: initialAddresses,

  addAddress: (address: Address) => {
    const state = get();
    let updatedAddresses = [...state.addresses];
    if (address.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => {
        const resetAddr = { ...a, isDefault: false };
        saveDocument(COLLECTION_PATH, resetAddr);
        return resetAddr;
      });
    }
    if (updatedAddresses.length === 0) {
      address.isDefault = true;
    }
    saveDocument(COLLECTION_PATH, address);
    set({ addresses: [...updatedAddresses, address] });
  },

  setDefaultAddress: (id: string) => {
    set((state) => {
      const updated = state.addresses.map((a) => {
        const isDef = a.id === id;
        const updatedAddr = { ...a, isDefault: isDef };
        saveDocument(COLLECTION_PATH, updatedAddr);
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
    // Sync initial mock items to Firestore once if needed
    initialAddresses.forEach((addr) => saveDocument(COLLECTION_PATH, addr));

    const unsubscribe = syncCollection<Address>(COLLECTION_PATH, (remoteAddresses) => {
      if (remoteAddresses.length > 0) {
        set({ addresses: remoteAddresses });
      }
    });
    return unsubscribe;
  },
}));

// Initialize sync immediately
useAddressStore.getState().initSync();
