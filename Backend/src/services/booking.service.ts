import prisma from '../config/prisma';
import { generateSafeRef, isValidTransition } from '../utils/booking.utils';

const db: any = prisma;

const computeDurationLabel = (startDate: Date, endDate: Date) => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return days === 1 ? '1 DAY' : `${days} DAYS`;
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Phone numbers must be exactly 10 digits (spaces/dashes/parentheses/leading
// +91 are stripped before checking so common formatting doesn't get rejected).
const PHONE_DIGITS_REGEX = /^\d{10}$/;

const normalizePhone = (rawPhone: unknown): string | undefined => {
  if (rawPhone === undefined || rawPhone === null || rawPhone === '') return undefined;
  const digitsOnly = String(rawPhone).replace(/[^\d]/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!PHONE_DIGITS_REGEX.test(digitsOnly)) {
    throw new ValidationError('Phone number must be exactly 10 digits');
  }
  return digitsOnly;
};

const createActivity = async (
  bookingId: string,
  action: string,
  description: string,
  performedBy = 'System',
  status?: string,
  metadata?: any
) =>
  db.bookingActivity.create({
    data: {
      bookingId,
      action,
      description,
      performedBy,
      status,
      metadata: metadata ?? undefined,
      timestamp: new Date(),
    },
  });

export const createBooking = async (data: any) => {
  const initials = String(data.clientName || '')
    .split(' ')
    .map((x: string) => x[0] || '')
    .join('')
    .toUpperCase();

  const emailRaw = String(data.clientEmail || '').trim();
  const email = emailRaw ? emailRaw.toLowerCase() : '';
  const clientEmailToUse = email || `no-email+${Date.now()}@local.invalid`;
  const phone = normalizePhone(data.clientPhone);

  const client = await prisma.client.upsert({
    where: { email: clientEmailToUse },
    update: {
      name: data.clientName,
      phone,
      avatarInitials: initials,
    },
    create: {
      name: data.clientName,
      email: clientEmailToUse,
      phone,
      avatarInitials: initials,
    },
  });

  const bookingRef = await generateSafeRef(async (candidate: string) => {
    const existing = await prisma.booking.findUnique({ where: { bookingRef: candidate } });
    return !!existing;
  });
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const venueType = data.venueType || 'General';
  const durationLabel = computeDurationLabel(startDate, endDate);

  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      clientId: client.id,
      eventTitle: data.eventTitle,
      quotationId: data.quotationId ? String(data.quotationId).trim() : undefined,
      venue: data.venue,
      venueType,
      startDate,
      endDate,
      durationLabel,
      revenue: Number(data.revenue) || 0,
      guestCount: data.guestCount ? Number(data.guestCount) : undefined,
      notes: data.notes,
      status: data.status || 'PENDING',
      confirmedAt: data.status === 'CONFIRMED' ? new Date() : undefined,
      onHoldAt: data.status === 'ON_HOLD' ? new Date() : undefined,
    },
    include: { client: true },
  });

  await createActivity(
    booking.id,
    'Booking Created',
    `Booking ${booking.bookingRef} created`,
    'System',
    'PENDING',
    { venue: booking.venue, clientId: booking.clientId }
  );

  return booking;
};

export const getBookings = async (filters: any = {}) => {
  const where: any = {};
  const and: any[] = [];

  if (filters.status) {
    and.push({ status: filters.status });
  }

  if (filters.venueType) {
    and.push({ venueType: filters.venueType });
  }

  if (filters.dateFrom) {
    and.push({ startDate: { gte: new Date(filters.dateFrom) } });
  }

  if (filters.dateTo) {
    and.push({ endDate: { lte: new Date(filters.dateTo) } });
  }

  if (filters.search) {
    and.push({
      OR: [
        { bookingRef: { contains: filters.search, mode: 'insensitive' } },
        { eventTitle: { contains: filters.search, mode: 'insensitive' } },
        { venue: { contains: filters.search, mode: 'insensitive' } },
        { client: { name: { contains: filters.search, mode: 'insensitive' } } },
      ],
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return prisma.booking.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const getBookingById = async (id: string) =>
  prisma.booking.findFirst({
    where: {
      OR: [{ id }, { bookingRef: id }],
    },
    include: {
      client: true,
      holds: true,
      deposits: true,
      changeOrders: true,
      handoff: true,
      activities: true,
    },
  });

export const updateBooking = async (id: string, data: any) => {
  const existing = await getBookingById(id);
  if (!existing) return null;

  const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
  const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

  const updateData: any = {
    eventTitle: data.eventTitle ?? existing.eventTitle,
    quotationId: data.quotationId !== undefined ? String(data.quotationId).trim() || null : existing.quotationId,
    venue: data.venue ?? existing.venue,
    venueType: data.venueType ?? existing.venueType,
    startDate,
    endDate,
    durationLabel: data.durationLabel ?? computeDurationLabel(startDate, endDate),
    revenue: data.revenue !== undefined ? Number(data.revenue) : Number(existing.revenue),
    guestCount: data.guestCount !== undefined ? Number(data.guestCount) : existing.guestCount,
    notes: data.notes ?? existing.notes,
  };

  if (data.clientPhone !== undefined || data.clientName !== undefined || data.clientEmail !== undefined) {
    const clientUpdateData: any = {};
    if (data.clientPhone !== undefined) {
      clientUpdateData.phone = normalizePhone(data.clientPhone);
    }
    if (data.clientName !== undefined && String(data.clientName).trim()) {
      clientUpdateData.name = String(data.clientName).trim();
      clientUpdateData.avatarInitials = String(data.clientName)
        .split(' ')
        .map((x: string) => x[0] || '')
        .join('')
        .toUpperCase();
    }
    if (data.clientEmail !== undefined && String(data.clientEmail).trim()) {
      clientUpdateData.email = String(data.clientEmail).trim().toLowerCase();
    }
    if (Object.keys(clientUpdateData).length > 0) {
      await prisma.client.update({ where: { id: existing.clientId }, data: clientUpdateData });
    }
  }

  if (data.status && data.status !== existing.status) {
    // enforce allowed transitions
    if (!isValidTransition(existing.status, data.status)) {
      throw new Error(`Invalid status transition from ${existing.status} to ${data.status}`);
    }
    updateData.status = data.status;
    if (data.status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
      updateData.onHoldAt = null;
    }
    if (data.status === 'IN_PROGRESS') updateData.startedAt = new Date();
    if (data.status === 'COMPLETED') updateData.completedAt = new Date();
    if (data.status === 'CANCELLED') updateData.cancelledAt = new Date();
    if (data.status === 'ON_HOLD') updateData.onHoldAt = new Date();
  }

  const updated = await prisma.booking.update({
    where: { id: existing.id },
    data: updateData,
    include: { client: true },
  });

  await createActivity(
    updated.id,
    'Booking Updated',
    `Booking ${updated.bookingRef} was updated`,
    'Operations',
    updated.status,
    { updatedFields: Object.keys(updateData) }
  );

  return updated;
};

export const getBookingTimeline = async (id: string) => {
  const booking = await getBookingById(id);
  if (!booking) return [];

  const activities = await db.bookingActivity.findMany({
    where: { bookingId: booking.id },
    orderBy: { timestamp: 'asc' },
  });

  if (activities.length === 0) {
    return [
      {
        id: `${booking.id}-created`,
        action: 'Booking Created',
        description: `Booking ${booking.bookingRef} created`,
        performedBy: 'System',
        timestamp: booking.createdAt.toISOString(),
        status: 'PENDING',
      },
    ];
  }

  return activities.map((activity: any) => ({
    id: activity.id,
    action: activity.action,
    description: activity.description,
    performedBy: activity.performedBy,
    timestamp: activity.timestamp.toISOString(),
    status: activity.status as string | undefined,
  }));
};

export const changeBookingStatus = async (id: string, status: string) => {
  const booking = await getBookingById(id);
  if (!booking) return null;

  if (!isValidTransition(booking.status, status)) {
    throw new Error(`Invalid status transition from ${booking.status} to ${status}`);
  }

  const updateData: any = { status };
  if (status === 'CONFIRMED') {
    updateData.confirmedAt = new Date();
    updateData.onHoldAt = null;
  }
  if (status === 'IN_PROGRESS') updateData.startedAt = new Date();
  if (status === 'COMPLETED') updateData.completedAt = new Date();
  if (status === 'CANCELLED') updateData.cancelledAt = new Date();

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: updateData, include: { client: true } });

  const action =
    status === 'CONFIRMED'
      ? 'Booking Confirmed'
      : status === 'IN_PROGRESS'
      ? 'Event Started'
      : status === 'COMPLETED'
      ? 'Event Completed'
      : `Status Updated to ${status}`;

  await createActivity(
    updated.id,
    action,
    `Status changed to ${status}`,
    'Operations',
    status
  );

  return updated;
};

export const cancelBooking = async (id: string, data: any) => {
  const booking = await getBookingById(id);
  if (!booking) return null;

  const notes = [booking.notes, data.reason, data.notes].filter(Boolean).join(' | ');

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED', notes, cancelledAt: new Date() },
    include: { client: true },
  });

  await createActivity(
    updated.id,
    'Booking Cancelled',
    `Booking cancelled: ${data.reason || 'No reason provided'}`,
    'Operations',
    'CANCELLED',
    { cancellationNotes: data.notes }
  );

  return updated;
};

export const holdBooking = async (id: string, data: any) => {
  const booking = await getBookingById(id);
  if (!booking) return null;

  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const hold = await db.hold.create({
    data: {
      bookingId: booking.id,
      reason: data.reason || 'Hold requested',
      heldBy: data.heldBy || 'Operations',
      expiresAt,
      status: data.status || 'ACTIVE',
      notes: data.notes,
    },
  });

  const notes = [booking.notes, `Hold: ${hold.reason}`].filter(Boolean).join(' | ');

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'ON_HOLD', notes, onHoldAt: new Date() },
    include: { client: true },
  });

  await createActivity(
    updated.id,
    'Booking On Hold',
    `Booking moved to hold: ${hold.reason}`,
    'Operations',
    'ON_HOLD',
    { holdId: hold.id }
  );

  return updated;
};

export const getHoldsByBooking = async (id: string) =>
  db.hold.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: 'desc' },
  });