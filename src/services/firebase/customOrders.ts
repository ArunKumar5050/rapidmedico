import { collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from './firestore';

export interface CustomOrder {
  id?: string;
  medicineName: string;
  userName: string;
  mobile: string;
  address: string;
  status: 'processing' | 'confirmed' | 'paid' | 'completed';
  createdAt: any;
  userId: string;
  storeId?: string;
  billAmount?: number;
}

export const createCustomOrder = async (orderData: Omit<CustomOrder, 'id' | 'createdAt' | 'status'>) => {
  try {
    const ordersRef = collection(db, 'customOrders');
    const newOrder = {
      ...orderData,
      status: 'processing',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(ordersRef, newOrder);
    return docRef.id;
  } catch (error) {
    console.error("Error creating custom order:", error);
    throw error;
  }
};

export const subscribeToCustomOrder = (orderId: string, callback: (order: CustomOrder | null) => void) => {
  const docRef = doc(db, 'customOrders', orderId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as CustomOrder);
    } else {
      callback(null);
    }
  });
};

export const subscribeToUserCustomOrders = (userId: string, callback: (orders: CustomOrder[]) => void) => {
  const ordersRef = collection(db, 'customOrders');
  const q = query(ordersRef, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const orders: CustomOrder[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as CustomOrder);
    });
    callback(orders);
  }, (error) => {
    console.error("Error syncing user custom orders:", error);
  });
};

export const payCustomOrder = async (orderId: string) => {
  try {
    const docRef = doc(db, 'customOrders', orderId);
    await updateDoc(docRef, {
      status: 'paid',
    });
  } catch (error) {
    console.error("Error paying custom order:", error);
    throw error;
  }
};
