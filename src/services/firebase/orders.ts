import { collection, addDoc, doc, onSnapshot, serverTimestamp, query, where, orderBy, updateDoc } from 'firebase/firestore';
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
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  prescriptionUrl?: string; // Optional: attached if uploaded
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'COD';
  notes?: string;
  deliveryOtp?: string;
  otp?: string;
  pickupOtp?: string;
  storePickupOtp?: string;
  deliveryPartnerAssignedAt?: string;
  latitude?: number;
  longitude?: number;
  customerLat?: number;
  customerLng?: number;
  userLat?: number;
  userLng?: number;
  location?: {
    lat: number;
    lng: number;
    latitude?: number;
    longitude?: number;
    timestamp?: number;
    accuracy?: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const generateDeliveryOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
  try {
    const ordersRef = collection(db, 'orders');
    const newOrder = {
      ...orderData,
      status: 'PENDING',
      paymentStatus: orderData.paymentMethod === 'COD' ? 'COD' : 'PENDING',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(ordersRef, newOrder);

    // Trigger push notification to stores
    import('../notifications').then(({ sendPushNotificationToStores }) => {
      sendPushNotificationToStores(
        'New Medicine Order!', 
        `A customer placed an order for ₹${orderData.totalAmount}.`,
        { orderId: docRef.id, type: 'regular' }
      );
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const subscribeToUserOrders = (userId: string, callback: (orders: Order[]) => void) => {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    callback(orders);
  }, (error) => {
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

export const payOrder = async (orderId: string, paymentMethod: 'RAZORPAY' | 'COD' = 'RAZORPAY') => {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'COD' : 'COMPLETED',
    });
  } catch (error) {
    console.error("Error paying order:", error);
    throw error;
  }
};

export const assignDeliveryPartnerToOrder = async (orderId: string, partnerDetails?: any) => {
  try {
    const otp = generateDeliveryOtp();
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status: 'ASSIGNED',
      deliveryOtp: otp,
      otp: otp,
      pickupOtp: otp,
      storePickupOtp: otp,
      deliveryPartnerAssignedAt: new Date().toISOString(),
      ...(partnerDetails || {}),
      updatedAt: new Date().toISOString()
    });
    return otp;
  } catch (error) {
    console.error("Error assigning delivery partner to order:", error);
    throw error;
  }
};
