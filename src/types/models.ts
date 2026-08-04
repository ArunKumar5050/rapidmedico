export enum OrderStatus {
  SearchingNearbyPharmacy = 'SEARCHING_NEARBY_PHARMACY',
  FindingBestStore = 'FINDING_BEST_STORE',
  PreparingOrder = 'PREPARING_ORDER',
  DeliveryPartnerAssigned = 'DELIVERY_PARTNER_ASSIGNED',
  OutForDelivery = 'OUT_FOR_DELIVERY',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NETBANKING = 'NETBANKING',
  WALLET = 'WALLET',
  COD = 'COD',
}

export enum RelationType {
  PARENT = 'PARENT',
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  OTHER = 'OTHER',
}

export enum HealthRecordType {
  ALLERGY = 'ALLERGY',
  CHRONIC_CONDITION = 'CHRONIC_CONDITION',
  PAST_PRESCRIPTION = 'PAST_PRESCRIPTION',
  LAB_REPORT = 'LAB_REPORT',
}

export enum NotificationCategory {
  ORDER_UPDATES = 'ORDER_UPDATES',
  REMINDERS = 'REMINDERS',
  OFFERS = 'OFFERS',
  CHAT = 'CHAT',
}

export enum ReminderFrequency {
  DAILY = 'DAILY',
  SPECIFIC_DAYS = 'SPECIFIC_DAYS',
  INTERVAL = 'INTERVAL',
}

export interface User {
  uid: string;
  phone: string;
  fullName: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  profileComplete: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  addressText: string;
  landmark?: string;
  lat: number;
  lng: number;
  receiverName?: string;
  receiverPhone?: string;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
  requiresPrescription: boolean;
  attachedPrescriptionRef?: string;
  forFamilyMemberId?: string;
}

export interface CustomerOrder {
  id: string;
  status: OrderStatus;
  items: CartItem[];
  addressId: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  isEmergency: boolean;
  riderName?: string;
  riderPhotoUrl?: string;
  riderRatingAvg?: number;
  placedAt: string;
  deliveredAt?: string;
  // NOTE: STRICT PRIVACY BOUNDARY ENFORCED
  // No pharmacy fields exist in this model or any client projection
}

export interface Reminder {
  id: string;
  medicineName: string;
  dosage?: string;
  frequency: ReminderFrequency;
  times: string[];
  startDate: string;
  endDate?: string;
  forFamilyMemberId?: string;
  active: boolean;
}
