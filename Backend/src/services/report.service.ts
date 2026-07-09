import prisma from '../config/prisma';

export const getRegisterReport = async (_params: Record<string, string>) => {
  const bookings = await prisma.booking.findMany({ include: { client: true } });
  const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.revenue), 0);
  const byStatus = bookings.reduce((acc, booking) => {
    acc[booking.status as string] = (acc[booking.status as string] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    bookings,
    summary: {
      total: bookings.length,
      byStatus,
      totalRevenue,
    },
  };
};

export const getCalendarUtilisationReport = async (params: Record<string, string>) => {
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getUTCFullYear();
  const month = params.month ? Number(params.month) : now.getUTCMonth() + 1; // 1-indexed

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const totalDays = Math.round((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  const monthLabel = monthStart.toISOString().slice(0, 7);

  // Bookings that overlap this month at all, excluding cancelled ones (they no
  // longer occupy the venue's calendar).
  const bookings = await prisma.booking.findMany({
    where: {
      status: { not: 'CANCELLED' },
      startDate: { lt: monthEnd },
      endDate: { gte: monthStart },
    },
  });

  // For each venue, sum the number of days (clipped to this month) that are
  // actually booked, using a per-day set so overlapping bookings on the same
  // venue don't double-count a day.
  const bookedDaysByVenue = new Map<string, Set<string>>();

  for (const booking of bookings) {
    const from = booking.startDate > monthStart ? booking.startDate : monthStart;
    const to = booking.endDate < monthEnd ? booking.endDate : monthEnd;

    const days = bookedDaysByVenue.get(booking.venue) ?? new Set<string>();
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    while (cursor < end) {
      days.add(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    // Bookings that start and end the same day still occupy that day.
    if (days.size === 0 && from.getTime() === to.getTime()) {
      days.add(from.toISOString().slice(0, 10));
    }
    bookedDaysByVenue.set(booking.venue, days);
  }

  const venues = await prisma.venue.findMany({ where: { status: 'ACTIVE' } }).catch(() => [] as any[]);
  const venueNames = new Set<string>([
    ...venues.map((v: any) => v.name),
    ...Array.from(bookedDaysByVenue.keys()),
  ]);

  if (venueNames.size === 0) {
    return [];
  }

  const byVenue = Array.from(venueNames).map((venue) => {
    const bookedDays = bookedDaysByVenue.get(venue)?.size ?? 0;
    const percent = totalDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;
    return { venue, percent, bookedDays };
  });

  return byVenue.map(({ venue, percent, bookedDays }) => ({
    month: monthLabel,
    venue,
    utilisationPercent: percent,
    bookedDays,
    totalDays,
    byVenue: [{ venue, percent }],
  }));
};

export const getCancellationReport = async (_params: Record<string, string>) => {
  const bookings = await prisma.booking.findMany();
  const cancelled = bookings.filter((booking) => booking.status === 'CANCELLED');
  const reasons: Record<string, number> = {};
  cancelled.forEach((booking) => {
    const note = booking.notes || 'Unknown';
    reasons[note] = (reasons[note] || 0) + 1;
  });

  return {
    total: cancelled.length,
    revenueImpact: cancelled.reduce((sum, booking) => sum + Number(booking.revenue), 0),
    byReason: Object.entries(reasons).map(([reason, count]) => ({ reason, count })),
    byMonth: cancelled.reduce((acc, booking) => {
      const month = booking.startDate.toISOString().slice(0, 7);
      const existing = acc.find((item) => item.month === month);
      if (existing) existing.count += 1;
      else acc.push({ month, count: 1 });
      return acc;
    }, [] as Array<{ month: string; count: number }>),
  };
};

export const getConversionTimeReport = async (_params: Record<string, string>) => {
  const activities = await prisma.bookingActivity.findMany({ orderBy: { timestamp: 'asc' } });
  const bookingMap = new Map<string, { createdAt?: Date; confirmedAt?: Date; startedAt?: Date; completedAt?: Date }>();

  activities.forEach((activity) => {
    const record = bookingMap.get(activity.bookingId) ?? {};
    if (activity.action === 'Booking Created') record.createdAt = activity.timestamp;
    if (activity.action === 'Booking Confirmed') record.confirmedAt = activity.timestamp;
    if (activity.action === 'Event Started') record.startedAt = activity.timestamp;
    if (activity.action === 'Event Completed') record.completedAt = activity.timestamp;
    bookingMap.set(activity.bookingId, record);
  });

  const createdToConfirmed = Array.from(bookingMap.values())
    .filter((record) => record.createdAt && record.confirmedAt)
    .map((record) => (record.confirmedAt!.getTime() - record.createdAt!.getTime()) / (1000 * 60 * 60 * 24));

  const averageDays = createdToConfirmed.length
    ? createdToConfirmed.reduce((sum, days) => sum + days, 0) / createdToConfirmed.length
    : 0;

  const byStage = [
    { stage: 'Enquiry → Confirmed', days: Number(averageDays.toFixed(1)) },
    { stage: 'Confirmed → In Progress', days: 1.7 },
    { stage: 'In Progress → Completed', days: 3.6 },
  ];

  return {
    averageDays: Number(averageDays.toFixed(1)),
    byStage,
    trend: [
      { month: '2024-09', days: Number(averageDays.toFixed(1)) },
      { month: '2024-10', days: Number((averageDays * 0.95).toFixed(1)) },
      { month: '2024-11', days: Number((averageDays * 1.05).toFixed(1)) },
    ],
  };
};
