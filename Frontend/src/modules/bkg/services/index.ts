import httpClient from './httpClient';
import type {
  ApiResponse,
  User,
  AuthResponse,
  Booking,
  Venue,
  BookingTimeline,
  BookingFilters,
  Hold,
  Deposit,
  ChangeOrder,
  Conflict,
  CalendarEvent,
  DashboardStats,
  DashboardAlert,
  CalendarSummary,
  RegisterReport,
  CalendarUtilisationReport,
  CancellationReport,
  ConversionTimeReport,
  HandoffData,
  BookingDocument,
} from '../types';
import type {
  BookingFormValues,
  HoldFormValues,
  DepositFormValues,
  ChangeOrderFormValues,
  CancellationFormValues,
  ConflictCheckFormValues,
} from '../schemas';

// ─── Dashboard API ────────────────────────────────────────────────────────────
export const AuthApi = {
  login: (data: { email: string; password: string; remember?: boolean }) =>
    httpClient.post<ApiResponse<AuthResponse>>('/auth/login', data).then((r) => r.data),
  register: (data: { name: string; email: string; password: string }) =>
    httpClient.post<ApiResponse<AuthResponse>>('/auth/register', data).then((r) => r.data),
  logout: () => httpClient.post<ApiResponse>('/auth/logout').then((r) => r.data),
  profile: () => httpClient.get<ApiResponse<User>>('/auth/profile').then((r) => r.data),
};

export const DashboardApi = {
  getStats: () =>
    httpClient.get<ApiResponse<DashboardStats>>('/bkg/dashboard').then((r) => r.data),

  getAlerts: () =>
    httpClient.get<ApiResponse<DashboardAlert[]>>('/bkg/dashboard/alerts').then((r) => r.data),

  getCalendarSummary: () =>
    httpClient
      .get<ApiResponse<CalendarSummary[]>>('/bkg/dashboard/calendar-summary')
      .then((r) => r.data),
};

// ─── Venue API ──────────────────────────────────────────────────────────────
export const VenueApi = {
  list: () => httpClient.get<ApiResponse<Venue[]>>('/bkg/venues').then((r) => r.data),
  create: (data: { name: string; city?: string; address?: string; capacity?: number; type?: string; description?: string; status?: string }) =>
    httpClient.post<ApiResponse<Venue>>('/bkg/venues', data).then((r) => r.data),
};

// ─── Booking API ──────────────────────────────────────────────────────────────
export const BookingApi = {
  list: (filters?: BookingFilters) =>
    httpClient
      .get<ApiResponse<Booking[]>>('/bkg/bookings', { params: filters })
      .then((r) => r.data),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Booking>>(`/bkg/bookings/${id}`).then((r) => r.data),

  create: (data: BookingFormValues) =>
    httpClient.post<ApiResponse<Booking>>('/bkg/bookings', data).then((r) => r.data),

  update: (id: string, data: Partial<BookingFormValues>) =>
    httpClient.patch<ApiResponse<Booking>>(`/bkg/bookings/${id}`, data).then((r) => r.data),

  getTimeline: (id: string) =>
    httpClient
      .get<ApiResponse<BookingTimeline[]>>(`/bkg/bookings/${id}/timeline`)
      .then((r) => r.data),

  confirm: (id: string) =>
    httpClient.post<ApiResponse<Booking>>(`/bkg/bookings/${id}/confirm`).then((r) => r.data),

  start: (id: string) =>
    httpClient.post<ApiResponse<Booking>>(`/bkg/bookings/${id}/start`).then((r) => r.data),

  complete: (id: string) =>
    httpClient.post<ApiResponse<Booking>>(`/bkg/bookings/${id}/complete`).then((r) => r.data),

  cancel: (id: string, data: CancellationFormValues) =>
    httpClient
      .post<ApiResponse<Booking>>(`/bkg/bookings/${id}/cancel`, data)
      .then((r) => r.data),

  hold: (id: string, data: HoldFormValues) =>
    httpClient
      .post<ApiResponse<Booking>>(`/bkg/bookings/${id}/hold`, data)
      .then((r) => r.data),

  getHandoff: (id: string) =>
    httpClient
      .get<ApiResponse<HandoffData>>(`/bkg/bookings/${id}/handoff`)
      .then((r) => r.data),

  submitHandoff: (id: string, data: Partial<HandoffData>) =>
    httpClient
      .post<ApiResponse<HandoffData>>(`/bkg/bookings/${id}/handoff`, data)
      .then((r) => r.data),

  downloadClientPdf: (id: string) =>
    httpClient.get(`/bkg/bookings/${id}/client-pdf`, { responseType: 'blob' }),
};

// ─── Hold API ─────────────────────────────────────────────────────────────────
export const HoldApi = {
  list: () =>
    httpClient.get<ApiResponse<Hold[]>>('/bkg/holds').then((r) => r.data),

  getByBooking: (bookingId: string) =>
    httpClient
      .get<ApiResponse<Hold[]>>(`/bkg/bookings/${bookingId}/hold`)
      .then((r) => r.data),
};

// ─── Conflict API ─────────────────────────────────────────────────────────────
export const ConflictApi = {
  check: (data: ConflictCheckFormValues) =>
    httpClient
      .post<ApiResponse<Conflict[]>>('/bkg/conflicts/check', data)
      .then((r) => r.data),

  list: () =>
    httpClient.get<ApiResponse<Conflict[]>>('/bkg/conflicts').then((r) => r.data),
};

// ─── Calendar API ─────────────────────────────────────────────────────────────
export const CalendarApi = {
  getEvents: (params?: { month?: string; year?: string }) =>
    httpClient
      .get<ApiResponse<CalendarEvent[]>>('/bkg/calendar', { params })
      .then((r) => r.data),
};

// ─── Deposit API ──────────────────────────────────────────────────────────────
export const DepositApi = {
  getSchedule: (bookingId: string) =>
    httpClient
      .get<ApiResponse<Deposit[]>>(`/bkg/bookings/${bookingId}/deposit-schedule`)
      .then((r) => r.data),

  getAll: () =>
    httpClient
      .get<ApiResponse<Deposit[]>>('/bkg/holds/deposits')
      .then((r) => r.data),

  create: (bookingId: string, data: DepositFormValues) =>
    httpClient
      .post<ApiResponse<Deposit>>(`/bkg/bookings/${bookingId}/deposit-schedule`, data)
      .then((r) => r.data),

  update: (depositId: string, data: Partial<DepositFormValues> & { status?: string; paidDate?: string | null }) =>
    httpClient
      .patch<ApiResponse<Deposit>>(`/bkg/holds/deposits/${depositId}`, data)
      .then((r) => r.data),
};

// ─── Change Order API ─────────────────────────────────────────────────────────
export const ChangeOrderApi = {
  list: (bookingId: string) =>
    httpClient
      .get<ApiResponse<ChangeOrder[]>>(`/bkg/bookings/${bookingId}/change-orders`)
      .then((r) => r.data),

  getAll: () =>
    httpClient
      .get<ApiResponse<ChangeOrder[]>>('/bkg/holds/change-orders')
      .then((r) => r.data),

  create: (bookingId: string, data: ChangeOrderFormValues) =>
    httpClient
      .post<ApiResponse<ChangeOrder>>(`/bkg/bookings/${bookingId}/change-orders`, data)
      .then((r) => r.data),

  update: (changeOrderId: string, data: Partial<ChangeOrderFormValues> & { status?: string; approvedBy?: string }) =>
    httpClient
      .patch<ApiResponse<ChangeOrder>>(`/bkg/holds/change-orders/${changeOrderId}`, data)
      .then((r) => r.data),
};

// ─── Handoff API ──────────────────────────────────────────────────────────────
export const HandoffApi = {
  getByBooking: (bookingId: string) =>
    httpClient
      .get<ApiResponse<HandoffData>>(`/bkg/bookings/${bookingId}/handoff`)
      .then((r) => r.data),

  getAll: () =>
    httpClient
      .get<ApiResponse<HandoffData[]>>('/bkg/holds/handoffs')
      .then((r) => r.data),

  submit: (bookingId: string, data: Partial<HandoffData>) =>
    httpClient
      .post<ApiResponse<HandoffData>>(`/bkg/bookings/${bookingId}/handoff`, data)
      .then((r) => r.data),
};

// ─── Document API ─────────────────────────────────────────────────────────────
export const DocumentApi = {
  // Uploaded files attached to a booking
  list: (bookingId: string) =>
    httpClient.get<ApiResponse<BookingDocument[]>>(`/bkg/bookings/${bookingId}/documents`).then((r) => r.data),

  upload: (bookingId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient
      .post<ApiResponse<BookingDocument>>(`/bkg/bookings/${bookingId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  download: (docId: string) =>
    httpClient.get(`/bkg/bookings/documents/${docId}`, { responseType: 'blob' }),

  delete: (docId: string) =>
    httpClient.delete<ApiResponse>(`/bkg/bookings/documents/${docId}`).then((r) => r.data),

  // Generated, on-the-fly documents (confirmation letter / work order / event brief)
  generate: (bookingId: string, type: 'confirmation' | 'work-order' | 'event-brief') =>
    httpClient.get(`/bkg/bookings/${bookingId}/documents/generate/${type}`, { responseType: 'blob' }),
};

// ─── Report API ───────────────────────────────────────────────────────────────
export const ReportApi = {
  getRegister: (params?: Record<string, string>) =>
    httpClient
      .get<ApiResponse<RegisterReport>>('/bkg/reports/register', { params })
      .then((r) => r.data),

  getCalendarUtilisation: (params?: Record<string, string>) =>
    httpClient
      .get<ApiResponse<CalendarUtilisationReport[]>>('/bkg/reports/calendar-utilisation', {
        params,
      })
      .then((r) => r.data),

  getCancellations: (params?: Record<string, string>) =>
    httpClient
      .get<ApiResponse<CancellationReport>>('/bkg/reports/cancellations', { params })
      .then((r) => r.data),

  getConversionTime: (params?: Record<string, string>) =>
    httpClient
      .get<ApiResponse<ConversionTimeReport>>('/bkg/reports/conversion-time', { params })
      .then((r) => r.data),
};
