/**
 * Unit Tests – EventHub360 BKG Frontend
 *
 * Run with:  npx vitest
 * These tests are framework-agnostic pure-logic tests that work without
 * a DOM or network – all network calls are mocked via vi.mock.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Zod Schema Tests ─────────────────────────────────────────────────────────
import {
  bookingSchema,
  holdSchema,
  depositSchema,
  changeOrderSchema,
  cancellationSchema,
  conflictCheckSchema,
} from '../modules/bkg/schemas';

describe('bookingSchema', () => {
  const valid = {
    eventTitle: 'Global Tech Summit',
    clientName: 'Julianne Sterling',
    clientEmail: 'js@example.com',
    venue: 'Grand Ballroom',
    venueType: 'Grand Ballroom',
    startDate: '2024-10-12',
    endDate: '2024-10-14',
    revenue: 12450,
  };

  it('accepts a valid booking payload', () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing eventTitle', () => {
    const { eventTitle: _, ...rest } = valid;
    expect(bookingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(bookingSchema.safeParse({ ...valid, clientEmail: 'not-an-email' }).success).toBe(false);
  });

  it('rejects negative revenue', () => {
    expect(bookingSchema.safeParse({ ...valid, revenue: -100 }).success).toBe(false);
  });

  it('rejects eventTitle shorter than 3 chars', () => {
    expect(bookingSchema.safeParse({ ...valid, eventTitle: 'AB' }).success).toBe(false);
  });
});

describe('holdSchema', () => {
  const valid = {
    reason: 'Pending contract review',
    heldBy: 'Sales Manager',
    expiresAt: '2024-10-15T18:00:00Z',
  };

  it('accepts valid hold data', () => {
    expect(holdSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects reason shorter than 5 chars', () => {
    expect(holdSchema.safeParse({ ...valid, reason: 'No' }).success).toBe(false);
  });

  it('rejects missing expiresAt', () => {
    const { expiresAt: _, ...rest } = valid;
    expect(holdSchema.safeParse(rest).success).toBe(false);
  });
});

describe('depositSchema', () => {
  const valid = { amount: 5000, dueDate: '2024-10-01' };

  it('accepts valid deposit', () => {
    expect(depositSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects amount of 0', () => {
    expect(depositSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it('rejects missing dueDate', () => {
    expect(depositSchema.safeParse({ amount: 1000 }).success).toBe(false);
  });
});

describe('changeOrderSchema', () => {
  const valid = {
    title: 'Add AV Equipment',
    description: 'Include 4K projection system and speakers for main stage.',
    amountDelta: 1200,
    requestedBy: 'Client',
  };

  it('accepts valid change order', () => {
    expect(changeOrderSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts negative amountDelta', () => {
    expect(changeOrderSchema.safeParse({ ...valid, amountDelta: -500 }).success).toBe(true);
  });

  it('rejects description shorter than 10 chars', () => {
    expect(changeOrderSchema.safeParse({ ...valid, description: 'Short' }).success).toBe(false);
  });
});

describe('cancellationSchema', () => {
  const valid = {
    reason: 'Client has rescheduled the event to next quarter.',
    confirmedBy: 'Operations Manager',
  };

  it('accepts valid cancellation', () => {
    expect(cancellationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects reason shorter than 10 chars', () => {
    expect(cancellationSchema.safeParse({ ...valid, reason: 'Too short' }).success).toBe(false);
  });

  it('rejects missing confirmedBy', () => {
    const { confirmedBy: _, ...rest } = valid;
    expect(cancellationSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts optional refundAmount', () => {
    expect(cancellationSchema.safeParse({ ...valid, refundAmount: 3500 }).success).toBe(true);
  });
});

describe('conflictCheckSchema', () => {
  const valid = { venue: 'Grand Ballroom', startDate: '2024-10-12', endDate: '2024-10-14' };

  it('accepts valid conflict check', () => {
    expect(conflictCheckSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing venue', () => {
    const { venue: _, ...rest } = valid;
    expect(conflictCheckSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts optional excludeBookingId', () => {
    expect(conflictCheckSchema.safeParse({ ...valid, excludeBookingId: 'EH-8829' }).success).toBe(true);
  });
});

// ─── Mock Data Tests ──────────────────────────────────────────────────────────
import { MOCK_BOOKINGS, MOCK_DASHBOARD_STATS, MOCK_ALERTS } from '../modules/bkg/types/mockData';

describe('Mock Data integrity', () => {
  it('MOCK_BOOKINGS has 5 entries', () => {
    expect(MOCK_BOOKINGS).toHaveLength(5);
  });

  it('each booking has required fields', () => {
    MOCK_BOOKINGS.forEach((b) => {
      expect(b.id).toBeTruthy();
      expect(b.bookingRef).toMatch(/^EH-\d+$/);
      expect(b.client.name).toBeTruthy();
      expect(b.status).toBeTruthy();
      expect(typeof b.revenue).toBe('number');
    });
  });

  it('MOCK_DASHBOARD_STATS has positive values', () => {
    expect(MOCK_DASHBOARD_STATS.totalBookings).toBeGreaterThan(0);
    expect(MOCK_DASHBOARD_STATS.conversionRate).toBeGreaterThan(0);
    expect(MOCK_DASHBOARD_STATS.conversionRate).toBeLessThanOrEqual(100);
  });

  it('MOCK_ALERTS has unread and read alerts', () => {
    const unread = MOCK_ALERTS.filter((a) => !a.read);
    const read = MOCK_ALERTS.filter((a) => a.read);
    expect(unread.length).toBeGreaterThan(0);
    expect(read.length).toBeGreaterThan(0);
  });
});

// ─── Service Layer Tests (mocked Axios) ───────────────────────────────────────
vi.mock('../modules/bkg/services/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import httpClient from '../modules/bkg/services/httpClient';
import { BookingApi, DashboardApi, ConflictApi } from '../modules/bkg/services';

describe('BookingApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list() calls GET /bkg/bookings', async () => {
    const mockData = { success: true, data: MOCK_BOOKINGS };
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockData });

    const result = await BookingApi.list();
    expect(httpClient.get).toHaveBeenCalledWith('/bkg/bookings', { params: undefined });
    expect(result).toEqual(mockData);
  });

  it('list() passes filters as params', async () => {
    const mockData = { success: true, data: [] };
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockData });

    await BookingApi.list({ status: 'CONFIRMED', page: 1 });
    expect(httpClient.get).toHaveBeenCalledWith('/bkg/bookings', {
      params: { status: 'CONFIRMED', page: 1 },
    });
  });

  it('getById() calls GET /bkg/bookings/:id', async () => {
    const mockData = { success: true, data: MOCK_BOOKINGS[0] };
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockData });

    const result = await BookingApi.getById('1');
    expect(httpClient.get).toHaveBeenCalledWith('/bkg/bookings/1');
    expect(result.data).toEqual(MOCK_BOOKINGS[0]);
  });

  it('confirm() calls POST /bkg/bookings/:id/confirm', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { ...MOCK_BOOKINGS[0], status: 'CONFIRMED' } },
    });

    await BookingApi.confirm('1');
    expect(httpClient.post).toHaveBeenCalledWith('/bkg/bookings/1/confirm');
  });

  it('cancel() calls POST /bkg/bookings/:id/cancel with reason payload', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: {} },
    });

    const payload = {
      reason: 'Client cancelled due to budget constraints.',
      confirmedBy: 'Operations Manager',
    };
    await BookingApi.cancel('1', payload);
    expect(httpClient.post).toHaveBeenCalledWith('/bkg/bookings/1/cancel', payload);
  });

  it('getTimeline() calls correct endpoint', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });
    await BookingApi.getTimeline('2');
    expect(httpClient.get).toHaveBeenCalledWith('/bkg/bookings/2/timeline');
  });
});

describe('DashboardApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getStats() calls GET /bkg/dashboard', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: MOCK_DASHBOARD_STATS },
    });
    await DashboardApi.getStats();
    expect(httpClient.get).toHaveBeenCalledWith('/bkg/dashboard');
  });

  it('getAlerts() calls GET /bkg/dashboard/alerts', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: MOCK_ALERTS },
    });
    await DashboardApi.getAlerts();
    expect(httpClient.get).toHaveBeenCalledWith('/bkg/dashboard/alerts');
  });
});

describe('ConflictApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('check() calls POST /bkg/conflicts/check', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });
    const payload = {
      venue: 'Grand Ballroom',
      startDate: '2024-10-12',
      endDate: '2024-10-14',
    };
    await ConflictApi.check(payload);
    expect(httpClient.post).toHaveBeenCalledWith('/bkg/conflicts/check', payload);
  });

  it('list() calls GET /bkg/conflicts', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });
    await ConflictApi.list();
    expect(httpClient.get).toHaveBeenCalledWith('/bkg/conflicts');
  });
});

// ─── Query Key Uniqueness Tests ───────────────────────────────────────────────
import { queryKeys } from '../modules/bkg/hooks';

describe('queryKeys', () => {
  it('booking keys are unique per id', () => {
    const k1 = JSON.stringify(queryKeys.booking('1'));
    const k2 = JSON.stringify(queryKeys.booking('2'));
    expect(k1).not.toBe(k2);
  });

  it('bookings key varies with filters', () => {
    const k1 = JSON.stringify(queryKeys.bookings({ status: 'CONFIRMED' }));
    const k2 = JSON.stringify(queryKeys.bookings({ status: 'PENDING' }));
    expect(k1).not.toBe(k2);
  });

  it('timeline key is distinct from booking key', () => {
    const k1 = JSON.stringify(queryKeys.booking('1'));
    const k2 = JSON.stringify(queryKeys.timeline('1'));
    expect(k1).not.toBe(k2);
  });

  it('report keys are namespaced correctly', () => {
    const r = queryKeys.reports.register();
    expect(r[0]).toBe('reports');
    expect(r[1]).toBe('register');
  });
});
