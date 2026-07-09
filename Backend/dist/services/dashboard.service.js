"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarSummary = exports.getAlerts = exports.getStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getStats = async () => {
    const [bookingsRaw, holdsRaw, depositsRaw] = await Promise.all([
        prisma_1.default.booking.findMany({ include: { client: true } }),
        prisma_1.default.hold.findMany({ where: { status: 'ACTIVE' } }),
        prisma_1.default.depositSchedule.findMany(),
    ]);
    const bookings = bookingsRaw;
    const holds = holdsRaw;
    const deposits = depositsRaw;
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
    const onHoldBookings = bookings.filter((b) => b.status === 'ON_HOLD').length;
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.revenue), 0);
    const overdueDeposits = deposits.filter((deposit) => deposit.status === 'OVERDUE').length;
    const upcomingEvents = bookings.filter((booking) => {
        const now = new Date();
        return booking.startDate >= now && booking.startDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }).length;
    const now = new Date();
    const revenueThisMonth = bookings
        .filter((booking) => booking.startDate.getUTCFullYear() === now.getUTCFullYear() && booking.startDate.getUTCMonth() === now.getUTCMonth())
        .reduce((sum, booking) => sum + Number(booking.revenue), 0);
    const conversionRate = totalBookings === 0 ? 0 : Math.round((confirmedBookings / totalBookings) * 100);
    // Distribution of bookings across statuses, for the dashboard pie/bar chart.
    const statusBreakdown = [
        { status: 'PENDING', label: 'Pending', count: pendingBookings },
        { status: 'ON_HOLD', label: 'On Hold', count: onHoldBookings },
        { status: 'CONFIRMED', label: 'Confirmed', count: confirmedBookings },
        {
            status: 'IN_PROGRESS',
            label: 'In-Progress',
            count: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
        },
        { status: 'COMPLETED', label: 'Completed', count: completedBookings },
        { status: 'CANCELLED', label: 'Cancelled', count: cancelledBookings },
    ].filter((s) => s.count > 0);
    // Revenue trend for the last 6 months (including the current one).
    const revenueTrend = [];
    for (let i = 5; i >= 0; i -= 1) {
        const monthDate = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
        const label = monthDate.toLocaleString('en-US', { month: 'short' });
        const monthRevenue = bookings
            .filter((b) => b.startDate.getUTCFullYear() === monthDate.getUTCFullYear() &&
            b.startDate.getUTCMonth() === monthDate.getUTCMonth())
            .reduce((sum, b) => sum + Number(b.revenue), 0);
        revenueTrend.push({ month: label, revenue: monthRevenue });
    }
    return {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        onHoldBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        revenueThisMonth,
        conversionRate,
        upcomingEvents,
        overdueDeposits,
        activeHolds: holds.length,
        statusBreakdown,
        revenueTrend,
    };
};
exports.getStats = getStats;
const getAlerts = async () => {
    const bookings = await prisma_1.default.booking.findMany({ include: { client: true } });
    const now = new Date();
    const alerts = bookings.reduce((acc, booking) => {
        const daysUntilStart = Math.ceil((booking.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (booking.status === 'PENDING' && daysUntilStart <= 7 && daysUntilStart >= 0) {
            acc.push({
                id: booking.id,
                type: 'warning',
                title: 'Upcoming Task',
                message: `${booking.eventTitle} begins in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}`,
                bookingId: booking.id,
                createdAt: booking.updatedAt.toISOString(),
                read: false,
            });
        }
        if (booking.status === 'ON_HOLD' && booking.startDate >= now) {
            acc.push({
                id: `${booking.id}-hold`,
                type: 'info',
                title: 'Hold Active',
                message: `${booking.client.name} has a hold on ${booking.eventTitle}`,
                bookingId: booking.id,
                createdAt: booking.updatedAt.toISOString(),
                read: false,
            });
        }
        return acc;
    }, []);
    return alerts;
};
exports.getAlerts = getAlerts;
const getCalendarSummary = async () => {
    const bookings = await prisma_1.default.booking.findMany();
    const grouping = {};
    bookings.forEach((booking) => {
        const date = booking.startDate.toISOString().split('T')[0];
        const key = `${date}-${booking.venue}`;
        if (!grouping[key]) {
            grouping[key] = {
                date,
                bookingCount: 0,
                venue: booking.venue,
                hasConflicts: false,
            };
        }
        grouping[key].bookingCount += 1;
    });
    const summary = Object.values(grouping).map((item) => ({
        ...item,
    }));
    return summary;
};
exports.getCalendarSummary = getCalendarSummary;
