import { collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from './firestore';

export interface CustomOrder {
  id?: string;
  medicines: string[];
  userName: string;
  mobile: string;
  address: string;
  status: 'processing' | 'confirmed' | 'paid' | 'completed' | string;
  storeStatus?: string;
  createdAt: any;
  userId: string;
  storeId?: string;
  billAmount?: number;
  itemizedBill?: { medicine: string, price: number }[];
  deliveryCharge?: number;
  imageUrls?: string[];
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
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

export const createCustomOrder = async (orderData: Omit<CustomOrder, 'id' | 'createdAt' | 'status'>) => {
  try {
    const ordersRef = collection(db, 'customOrders');
    const newOrder = {
      ...orderData,
      status: 'processing',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(ordersRef, newOrder);
    
    // Trigger push notification to stores
    import('../notifications').then(({ sendPushNotificationToStores }) => {
      sendPushNotificationToStores(
        'New Prescription Order!', 
        `${orderData.userName} requested a new order.`,
        { orderId: docRef.id, type: 'custom' }
      );
    });

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

export const payCustomOrder = async (orderId: string, paymentMethod: 'RAZORPAY' | 'COD' = 'RAZORPAY') => {
  try {
    const docRef = doc(db, 'customOrders', orderId);
    await updateDoc(docRef, {
      status: 'paid',
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'COD' : 'COMPLETED',
    });
  } catch (error) {
    console.error("Error paying custom order:", error);
    throw error;
  }
};

export const assignDeliveryPartnerToCustomOrder = async (orderId: string, partnerDetails?: any) => {
  try {
    const otp = generateDeliveryOtp();
    const docRef = doc(db, 'customOrders', orderId);
    await updateDoc(docRef, {
      storeStatus: 'DELIVERY_PARTNER_ASSIGNED',
      status: 'delivery boy assigned',
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
    console.error("Error assigning delivery partner to custom order:", error);
    throw error;
  }
};
