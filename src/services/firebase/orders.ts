import { collection, addDoc, doc, onSnapshot, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from './firestore';
import { CartItem } from '../../store/useCartStore';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface Order {
  id?: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'UPI' | 'CARD' | 'COD';
  isEmergency: boolean;
  address: string; // Storing simple address string for now
  status: OrderStatus;
  createdAt: any;
  storeId?: string; // Optional: assigned later by admin
  deliveryPartnerId?: string; // Optional: assigned later
}

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
  try {
    const ordersRef = collection(db, 'orders');
    const newOrder = {
      ...orderData,
      status: 'PENDING',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(ordersRef, newOrder);
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const subscribeToUserOrders = (userId: string, callback: (orders: Order[]) => void) => {
  // Query orders for this user
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    callback(orders);
  }, (error) => {
    // If index is missing, it will throw an error with a link to create it.
    console.error("Error syncing user orders:", error);
  });
};

export const subscribeToOrder = (orderId: string, callback: (order: Order | null) => void) => {
  const docRef = doc(db, 'orders', orderId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Order);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error syncing specific order:", error);
  });
};
