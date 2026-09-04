import { create } from 'zustand';
import { saveDocument, deleteDocument, syncCollection } from '../services/firebase/firestoreHelpers';

export type CartItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  rxRequired: boolean;
};

interface CartStore {
  cartItems: CartItem[];
  prescriptionUrl: string | null;
  prescriptionDescription: string;
  setPrescriptionUrl: (url: string | null) => void;
  setPrescriptionDescription: (desc: string) => void;
  addItem: (item: CartItem) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  initSync: () => () => void;
}

const COLLECTION_PATH = 'users/demo_user_123/cart';

const initialCartItems: CartItem[] = [
  { id: '1', name: 'Paracetamol 650mg', qty: 2, unitPrice: 30.5, rxRequired: false },
  { id: '2', name: 'Metformin 500mg', qty: 1, unitPrice: 45.0, rxRequired: true },
];

export const useCartStore = create<CartStore>((set, get) => ({
  cartItems: initialCartItems,
  prescriptionUrl: null,
  prescriptionDescription: '',

  setPrescriptionUrl: (url: string | null) => set({ prescriptionUrl: url }),
  setPrescriptionDescription: (desc: string) => set({ prescriptionDescription: desc }),

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
      saveDocument(COLLECTION_PATH, targetItem);
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
            saveDocument(COLLECTION_PATH, updatedItem);
            updated.push(updatedItem);
          } else {
            deleteDocument(COLLECTION_PATH, id);
          }
        } else {
          updated.push(item);
        }
      });
      return { cartItems: updated };
    });
  },

  clearCart: () => {
    get().cartItems.forEach((item) => deleteDocument(COLLECTION_PATH, item.id));
    set({ cartItems: [], prescriptionUrl: null, prescriptionDescription: '' });
  },

  initSync: () => {
    initialCartItems.forEach((item) => saveDocument(COLLECTION_PATH, item));
    const unsubscribe = syncCollection<CartItem>(COLLECTION_PATH, (remoteCart) => {
      if (remoteCart.length > 0) {
        set({ cartItems: remoteCart });
      }
    });
    return unsubscribe;
  },
}));

useCartStore.getState().initSync();
