import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DashboardApi,
  BookingApi,
  HoldApi,
  ConflictApi,
  CalendarApi,
  DepositApi,
  ChangeOrderApi,
  ReportApi,
  DocumentApi,
} from '../services';
import type { BookingFilters, HandoffData } from '../types';
import type {
  BookingFormValues,
  HoldFormValues,
  DepositFormValues,
  ChangeOrderFormValues,
  CancellationFormValues,
  ConflictCheckFormValues,
} from '../schemas';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  alerts: ['dashboard', 'alerts'] as const,
  calendarSummary: ['dashboard', 'calendar-summary'] as const,
  bookings: (filters?: BookingFilters) => ['bookings', filters] as const,
  booking: (id: string) => ['booking', id] as const,
  timeline: (id: string) => ['booking', id, 'timeline'] as const,
  holds: (bookingId?: string) => ['holds', bookingId] as const,
  conflicts: ['conflicts'] as const,
  calendar: (params?: Record<string, string>) => ['calendar', params] as const,
  deposits: (bookingId: string) => ['deposits', bookingId] as const,
  changeOrders: (bookingId: string) => ['change-orders', bookingId] as const,
  reports: {
    register: (params?: Record<string, string>) => ['reports', 'register', params] as const,
    utilisation: (params?: Record<string, string>) =>
      ['reports', 'utilisation', params] as const,
    cancellations: (params?: Record<string, string>) =>
      ['reports', 'cancellations', params] as const,
    conversionTime: (params?: Record<string, string>) =>
      ['reports', 'conversion-time', params] as const,
  },
};

// ─── Dashboard Hooks ──────────────────────────────────────────────────────────
export const useDashboard = () =>
  useQuery({ queryKey: queryKeys.dashboard, queryFn: DashboardApi.getStats, staleTime: 30_000 });

export const useAlerts = () =>
  useQuery({ queryKey: queryKeys.alerts, queryFn: DashboardApi.getAlerts, refetchInterval: 60_000 });

export const useCalendarSummary = () =>
  useQuery({
    queryKey: queryKeys.calendarSummary,
    queryFn: DashboardApi.getCalendarSummary,
  });

// ─── Booking Hooks ────────────────────────────────────────────────────────────
export const useBookings = (filters?: BookingFilters) =>
  useQuery({
    queryKey: queryKeys.bookings(filters),
    queryFn: () => BookingApi.list(filters),
  });

export const useBooking = (id: string) =>
  useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: () => BookingApi.getById(id),
    enabled: !!id,
  });

export const useTimeline = (id: string) =>
  useQuery({
    queryKey: queryKeys.timeline(id),
    queryFn: () => BookingApi.getTimeline(id),
    enabled: !!id,
  });

export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookingFormValues) => BookingApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
};

export const useConfirmBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BookingApi.confirm(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.booking(id) });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useCancelBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancellationFormValues }) =>
      BookingApi.cancel(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.booking(id) });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useStartBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BookingApi.start(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.booking(id) });
    },
  });
};

export const useCompleteBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BookingApi.complete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.booking(id) });
    },
  });
};

export const useHoldBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HoldFormValues }) =>
      BookingApi.hold(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.booking(id) });
    },
  });
};

// ─── Hold Hooks ───────────────────────────────────────────────────────────────
export const useHolds = (bookingId?: string) =>
  useQuery({
    queryKey: queryKeys.holds(bookingId),
    queryFn: () => (bookingId ? HoldApi.getByBooking(bookingId) : HoldApi.list()),
  });

// ─── Conflict Hooks ───────────────────────────────────────────────────────────
export const useConflicts = () =>
  useQuery({ queryKey: queryKeys.conflicts, queryFn: ConflictApi.list });

export const useCheckConflict = () =>
  useMutation({
    mutationFn: (data: ConflictCheckFormValues) => ConflictApi.check(data),
  });

// ─── Calendar Hook ────────────────────────────────────────────────────────────
export const useCalendar = (params?: Record<string, string>) =>
  useQuery({
    queryKey: queryKeys.calendar(params),
    queryFn: () => CalendarApi.getEvents(params),
  });

// ─── Deposit Hooks ────────────────────────────────────────────────────────────
export const useDeposits = (bookingId: string) =>
  useQuery({
    queryKey: queryKeys.deposits(bookingId),
    queryFn: () => DepositApi.getSchedule(bookingId),
    enabled: !!bookingId,
  });

export const useCreateDeposit = (bookingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DepositFormValues) => DepositApi.create(bookingId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deposits(bookingId) }),
  });
};

export const useUpdateDeposit = (bookingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ depositId, data }: { depositId: string; data: Partial<DepositFormValues> & { status?: string; paidDate?: string | null } }) =>
      DepositApi.update(depositId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deposits(bookingId) });
      qc.invalidateQueries({ queryKey: ['deposits'] });
      qc.invalidateQueries({ queryKey: queryKeys.booking(bookingId) });
    },
  });
};

// ─── Change Order Hooks ───────────────────────────────────────────────────────
export const useChangeOrders = (bookingId: string) =>
  useQuery({
    queryKey: queryKeys.changeOrders(bookingId),
    queryFn: () => ChangeOrderApi.list(bookingId),
    enabled: !!bookingId,
  });

export const useAllChangeOrders = () =>
  useQuery({
    queryKey: ['change-orders', 'all'],
    queryFn: () => ChangeOrderApi.getAll(),
  });

export const useCreateChangeOrder = (bookingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeOrderFormValues) => ChangeOrderApi.create(bookingId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.changeOrders(bookingId) }),
  });
};

export const useUpdateChangeOrder = (bookingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ changeOrderId, data }: { changeOrderId: string; data: Partial<ChangeOrderFormValues> & { status?: string; approvedBy?: string } }) =>
      ChangeOrderApi.update(changeOrderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.changeOrders(bookingId) });
      qc.invalidateQueries({ queryKey: ['change-orders'] });
      qc.invalidateQueries({ queryKey: queryKeys.booking(bookingId) });
    },
  });
};

export const useHandoff = (bookingId: string) =>
  useQuery({
    queryKey: ['handoff', bookingId],
    queryFn: () => BookingApi.getHandoff(bookingId),
    enabled: !!bookingId,
  });

export const useSubmitHandoff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: Partial<any> }) =>
      BookingApi.submitHandoff(bookingId, data as any),
    onSuccess: (_, { bookingId }) => {
      qc.invalidateQueries({ queryKey: ['handoff', bookingId] });
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
};

// ─── Document Hooks ───────────────────────────────────────────────────────────
export const useDocuments = (bookingId: string) =>
  useQuery({
    queryKey: ['documents', bookingId],
    queryFn: () => DocumentApi.list(bookingId),
    enabled: !!bookingId,
  });

export const useUploadDocument = (bookingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => DocumentApi.upload(bookingId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', bookingId] }),
  });
};

export const useDeleteDocument = (bookingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => DocumentApi.delete(docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', bookingId] }),
  });
};

// Triggers a browser download for a Blob response, used for both uploaded
// document downloads and generated (confirmation/work-order/event-brief) PDFs.
export const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ─── Report Hooks ─────────────────────────────────────────────────────────────
export const useReports = {
  register: (params?: Record<string, string>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: queryKeys.reports.register(params),
      queryFn: () => ReportApi.getRegister(params),
    }),
  utilisation: (params?: Record<string, string>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: queryKeys.reports.utilisation(params),
      queryFn: () => ReportApi.getCalendarUtilisation(params),
    }),
  cancellations: (params?: Record<string, string>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: queryKeys.reports.cancellations(params),
      queryFn: () => ReportApi.getCancellations(params),
    }),
  conversionTime: (params?: Record<string, string>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: queryKeys.reports.conversionTime(params),
      queryFn: () => ReportApi.getConversionTime(params),
    }),
};
