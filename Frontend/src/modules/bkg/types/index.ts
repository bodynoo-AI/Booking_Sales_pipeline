// ─── Standard API Response ────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
  errors?: ApiError[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: string;
  remember: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

// ─── Enums ────────────────────────────────────────────────────────────────────
export type BookingStatus =
  | 'PENDING'
  | 'DRAFT'
  | 'TENTATIVE'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type VenueType =
  | 'Grand Ballroom'
  | 'Innovation Lounge'
  | 'Azure Sky Ballroom'
  | 'Grand Rose Pavilion'
  | 'Rooftop Terrace'
  | 'Board Room';

export type HoldStatus = 'ACTIVE' | 'EXPIRED' | 'RELEASED' | 'CONVERTED';
export type DepositStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
export type ChangeOrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DocumentType = 'confirmation' | 'work-order' | 'event-brief';

// ─── Core Domain Types ────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarInitials: string;
  avatarColor?: string;
}

export interface Venue {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  capacity?: number | null;
  type: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingRef: string; // e.g. "EH-8829"
  client: Client;
  eventTitle: string;
  quotationId?: string | null;
  venue: string;
  venueType: VenueType;
  startDate: string;
  endDate: string;
  durationLabel: string; // e.g. "3 DAYS", "FULL DAY"
  status: BookingStatus;
  revenue: number;
  depositPaid: number;
  depositTotal: number;
  guestCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface BookingTimeline {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  status?: BookingStatus;
}

export interface Hold {
  id: string;
  bookingId: string;
  reason: string;
  heldBy: string;
  expiresAt: string;
  status: HoldStatus;
  notes?: string;
  createdAt: string;
}

export interface Deposit {
  id: string;
  bookingId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: DepositStatus;
  method?: string;
  reference?: string;
  notes?: string;
}

export interface ChangeOrder {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  amountDelta: number;
  requestedBy: string;
  status: ChangeOrderStatus;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conflict {
  id: string;
  bookingId: string;
  conflictingBookingId: string;
  venue: string;
  startDate: string;
  endDate: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  resolvedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  venue: string;
  status: BookingStatus;
  bookingRef: string;
  color?: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────
export interface DashboardStatusBreakdownItem {
  status: BookingStatus;
  label: string;
  count: number;
}

export interface DashboardRevenueTrendItem {
  month: string;
  revenue: number;
}

export interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  onHoldBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  activeHolds: number;
  totalRevenue: number;
  revenueThisMonth: number;
  conversionRate: number;
  upcomingEvents: number;
  overdueDeposits?: number;
  statusBreakdown?: DashboardStatusBreakdownItem[];
  revenueTrend?: DashboardRevenueTrendItem[];
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  bookingId?: string;
  createdAt: string;
  read: boolean;
}

export interface CalendarSummary {
  date: string;
  bookingCount: number;
  venue: string;
  hasConflicts: boolean;
}

// ─── Report Types ─────────────────────────────────────────────────────────────
export interface RegisterReport {
  bookings: Booking[];
  summary: {
    total: number;
    byStatus: Record<BookingStatus, number>;
    totalRevenue: number;
  };
}

export interface CalendarUtilisationReport {
  month: string;
  venue?: string;
  utilisationPercent: number;
  bookedDays: number;
  totalDays: number;
  byVenue: Array<{ venue: string; percent: number }>;
}

export interface CancellationReport {
  total: number;
  revenueImpact: number;
  byReason: Array<{ reason: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
}

export interface ConversionTimeReport {
  averageDays: number;
  byStage: Array<{ stage: string; days: number }>;
  trend: Array<{ month: string; days: number }>;
}

// ─── Form Input Types ─────────────────────────────────────────────────────────
export interface BookingFilters {
  search?: string;
  status?: BookingStatus | '';
  venueType?: VenueType | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface HandoffData {
  bookingId: string;
  handoffTo: string;
  notes: string;
  checklist: Array<{ item: string; completed: boolean }>;
  handoffAt: string;
}

// ─── Document Types ───────────────────────────────────────────────────────────
export interface BookingDocument {
  id: string;
  bookingId: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
