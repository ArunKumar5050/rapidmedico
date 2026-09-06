import { create } from 'zustand';
import { saveDocument, deleteDocument, syncCollection } from '../services/firebase/firestoreHelpers';
import { useAuthStore } from './auth';

export type CartItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  rxRequired: boolean;
  isCustom?: boolean;
  imageUrl?: string | null;
};

interface CartStore {
  cartItems: CartItem[];
  prescriptionUrl: string | null;
  prescriptionDescription: string;
  prescriptionOption: 'upload' | 'contact_doctor' | null;
  setPrescriptionUrl: (url: string | null) => void;
  setPrescriptionDescription: (desc: string) => void;
  setPrescriptionOption: (option: 'upload' | 'contact_doctor' | null) => void;
  addItem: (item: CartItem) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  initSync: (uid?: string) => () => void;
  unsubscribeSync?: () => void;
}

const getCollectionPath = (uid?: string) => {
  const userId = uid || useAuthStore.getState().user?.uid || 'demo_user_123';
  return `users/${userId}/cart`;
};

const initialCartItems: CartItem[] = [];

export const useCartStore = create<CartStore>((set, get) => ({
  cartItems: initialCartItems,
  prescriptionUrl: null,
  prescriptionDescription: '',
  prescriptionOption: null,

  setPrescriptionUrl: (url: string | null) => set({ prescriptionUrl: url }),
  setPrescriptionDescription: (desc: string) => set({ prescriptionDescription: desc }),
  setPrescriptionOption: (option) => set({ prescriptionOption: option }),

  addItem: (newItem: CartItem) => {
    set((state) => {
      const existing = state.cartItems.find((i) => i.id === newItem.id);
      let updated: CartItem[];
      if (existing) {
        updated = state.cartItems.map((i) =>
          i.id === newItem.id ? { ...i, qty: i.qty + newItem.qty } : i
        );
      } else {
        updated = [...state.cartItems, newItem];
      }
      const targetItem = updated.find((i) => i.id === newItem.id)!;
      saveDocument(getCollectionPath(), targetItem);
      return { cartItems: updated };
    });
  },

  updateQty: (id: string, delta: number) => {
    set((state) => {
      const updated: CartItem[] = [];
      state.cartItems.forEach((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty > 0) {
            const updatedItem = { ...item, qty: newQty };
            saveDocument(getCollectionPath(), updatedItem);
            updated.push(updatedItem);
          } else {
            deleteDocument(getCollectionPath(), id);
          }
        } else {
          updated.push(item);
        }
      });
      return { cartItems: updated };
    });
  },

  clearCart: () => {
    get().cartItems.forEach((item) => deleteDocument(getCollectionPath(), item.id));
    set({ cartItems: [], prescriptionUrl: null, prescriptionDescription: '', prescriptionOption: null });
  },

  initSync: (uid?: string) => {
    const path = getCollectionPath(uid);
    // Unsubscribe previous sync if exists
    if (get().unsubscribeSync) {
      get().unsubscribeSync!();
    }
    initialCartItems.forEach((item) => saveDocument(path, item));
    const unsubscribe = syncCollection<CartItem>(path, (remoteCart) => {
      set({ cartItems: remoteCart });
    });
    set({ unsubscribeSync: unsubscribe });
    return unsubscribe;
  },
}));

useAuthStore.subscribe((state, prevState) => {
  if (state.user?.uid !== prevState.user?.uid) {
    useCartStore.getState().initSync(state.user?.uid);
  }
});

useCartStore.getState().initSync(useAuthStore.getState().user?.uid);
