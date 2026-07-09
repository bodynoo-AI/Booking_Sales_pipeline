"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvents = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getEvents = async (params) => {
    const query = {};
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
    const bookings = await prisma_1.default.booking.findMany({
        where: query.where,
        include: { client: true },
    });
    return bookings.map((booking) => ({
        id: booking.id,
        title: booking.eventTitle,
        start: booking.startDate.toISOString(),
        end: booking.endDate.toISOString(),
        venue: booking.venue,
        status: booking.status,
        bookingRef: booking.bookingRef,
        color: booking.status === 'CONFIRMED' ? '#10b981' : booking.status === 'CANCELLED' ? '#ef4444' : '#f59e0b',
    }));
};
exports.getEvents = getEvents;
