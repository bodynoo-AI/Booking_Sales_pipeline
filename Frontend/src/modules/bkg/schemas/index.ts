import { z } from 'zod';

// ─── Booking Schema ───────────────────────────────────────────────────────────
export const bookingSchema = z.object({
  eventTitle: z.string().min(3, 'Event title must be at least 3 characters'),
  quotationId: z.string().optional(),
  clientName: z.string().min(2, 'Client name is required'),
  clientEmail: z.string().email('Valid email is required'),
  clientPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: 'Phone number must be exactly 10 digits',
    }),
  venue: z.string().min(1, 'Please select a venue'),
  venueType: z.string().min(1, 'Please select a venue type'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  guestCount: z.number().min(1, 'Guest count must be at least 1').optional(),
  revenue: z.number().min(0, 'Revenue cannot be negative'),
  notes: z.string().optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

// ─── Hold Schema ──────────────────────────────────────────────────────────────
export const holdSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  heldBy: z.string().min(2, 'Please enter who is placing this hold'),
  expiresAt: z.string().min(1, 'Expiry date/time is required'),
  notes: z.string().optional(),
});

export type HoldFormValues = z.infer<typeof holdSchema>;

// ─── Deposit Schedule Schema ──────────────────────────────────────────────────
export const depositSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  dueDate: z.string().min(1, 'Due date is required'),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type DepositFormValues = z.infer<typeof depositSchema>;

// ─── Change Order Schema ──────────────────────────────────────────────────────
export const changeOrderSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Please describe the change in detail'),
  amountDelta: z.number(),
  requestedBy: z.string().min(2, 'Requestor name is required'),
});

export type ChangeOrderFormValues = z.infer<typeof changeOrderSchema>;

// ─── Cancellation Schema ──────────────────────────────────────────────────────
export const cancellationSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason for cancellation'),
  refundAmount: z.number().min(0).optional(),
  confirmedBy: z.string().min(2, 'Confirmer name is required'),
  notes: z.string().optional(),
});

export type CancellationFormValues = z.infer<typeof cancellationSchema>;

// ─── Conflict Check Schema ────────────────────────────────────────────────────
export const conflictCheckSchema = z.object({
  venue: z.string().min(1, 'Venue is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  excludeBookingId: z.string().optional(),
});

export type ConflictCheckFormValues = z.infer<typeof conflictCheckSchema>;
