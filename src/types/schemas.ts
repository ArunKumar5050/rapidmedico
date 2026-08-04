import { z } from 'zod';
import { PaymentMethod } from './models';

export const PhoneEntrySchema = z.object({
  countryCode: z.string().regex(/^\+\d{1,3}$/, 'Invalid country code'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
});

export const ProfileCompletionSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').regex(/^[a-zA-Z\s-]+$/, 'Name can only contain letters, spaces, and hyphens'),
  email: z.string().email('Invalid email address').optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(), // Could add regex for DD/MM/YYYY
});

export const PlaceOrderInputSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  appliedCouponId: z.string().nullable(),
  isEmergency: z.boolean(),
  items: z.array(z.object({
    medicineId: z.string(),
    quantity: z.number().int().min(1).max(10),
    forFamilyMemberId: z.string().nullable(),
    attachedPrescriptionRef: z.string().nullable(),
  })).min(1, 'Cart cannot be empty'),
});
