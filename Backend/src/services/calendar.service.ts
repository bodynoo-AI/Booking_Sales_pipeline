import prisma from '../config/prisma';

export const getEvents = async (params: { month?: string; year?: string }) => {
  const query: any = {};
  if (params.month && params.year) {
    const month = Number(params.month);
    const year = Number(params.year);
    if (!Number.isNaN(month) && !Number.isNaN(year)) {
      const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const to = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      query.where = {
        OR: [
          { startDate: { gte: from, lt: to } },
          { endDate: { gte: from, lt: to } },
        ],
      };
    }
  }

  const bookings = await prisma.booking.findMany({
    where: query.where,
    include: { client: true },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    title: booking.eventTitle,
    start: booking.startDate.toISOString(),
    end: booking.endDate.toISOString(),
    venue: booking.venue,
    status: booking.status as any,
    bookingRef: booking.bookingRef,
    color: booking.status === 'CONFIRMED' ? '#10b981' : booking.status === 'CANCELLED' ? '#ef4444' : '#f59e0b',
  }));
};
