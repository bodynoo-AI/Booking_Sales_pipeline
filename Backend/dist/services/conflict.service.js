"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConflicts = exports.getAllConflicts = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const parseDate = (value) => new Date(value);
const getAllConflicts = async () => {
    const bookings = await prisma_1.default.booking.findMany();
    const conflicts = [];
    for (let i = 0; i < bookings.length; i += 1) {
        for (let j = i + 1; j < bookings.length; j += 1) {
            const first = bookings[i];
            const second = bookings[j];
            if (first.venue !== second.venue)
                continue;
            const firstStart = first.startDate.getTime();
            const firstEnd = first.endDate.getTime();
            const secondStart = second.startDate.getTime();
            const secondEnd = second.endDate.getTime();
            const overlaps = firstStart <= secondEnd && secondStart <= firstEnd;
            if (overlaps) {
                conflicts.push({
                    id: `${first.id}-${second.id}`,
                    bookingId: first.id,
                    conflictingBookingId: second.id,
                    venue: first.venue,
                    startDate: first.startDate.toISOString(),
                    endDate: first.endDate.toISOString(),
                    severity: 'HIGH',
                    description: `Overlapping event at ${first.venue}`,
                    resolvedAt: null,
                });
            }
        }
    }
    return conflicts;
};
exports.getAllConflicts = getAllConflicts;
const checkConflicts = async (payload) => {
    const { venue, startDate, endDate, excludeBookingId } = payload;
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const bookings = await prisma_1.default.booking.findMany({ where: { venue } });
    const conflicts = bookings
        .filter((booking) => booking.id !== excludeBookingId)
        .filter((booking) => {
        const bookingStart = booking.startDate.getTime();
        const bookingEnd = booking.endDate.getTime();
        return bookingStart <= end.getTime() && start.getTime() <= bookingEnd;
    })
        .map((booking) => ({
        id: `${booking.id}-${booking.bookingRef}`,
        bookingId: booking.id,
        conflictingBookingId: booking.id,
        venue: booking.venue,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        severity: 'HIGH',
        description: `Conflicts with ${booking.bookingRef}`,
        resolvedAt: null,
    }));
    return conflicts;
};
exports.checkConflicts = checkConflicts;
