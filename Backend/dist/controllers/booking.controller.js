"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHoldsByBooking = exports.addHold = exports.cancelBooking = exports.completeBooking = exports.startBooking = exports.confirmBooking = exports.getTimeline = exports.updateBooking = exports.getBookingById = exports.getBookings = exports.createBooking = void 0;
const bookingService = __importStar(require("../services/booking.service"));
const booking_service_1 = require("../services/booking.service");
const socket_1 = require("../socket");
const createBooking = async (req, res) => {
    try {
        const booking = await bookingService.createBooking(req.body);
        (0, socket_1.emitBkgEvent)('booking.created', {
            bookingId: booking.id,
            message: `New booking ${booking.bookingRef} created`,
        });
        (0, socket_1.emitBkgEvent)('calendar.updated', { bookingId: booking.id });
        // include recent bookings to allow UI to show latest entries immediately
        const recent = await bookingService.getBookings({ page: 1, limit: 5 });
        res.status(201).json({ success: true, data: booking, recentBookings: recent });
    }
    catch (error) {
        console.error(error);
        if (error instanceof booking_service_1.ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
};
exports.createBooking = createBooking;
const getBookings = async (req, res) => {
    try {
        const bookings = await bookingService.getBookings(req.query);
        res.json({ success: true, data: bookings });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};
exports.getBookings = getBookings;
const getBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(String(req.params.id));
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, data: booking });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch booking' });
    }
};
exports.getBookingById = getBookingById;
const updateBooking = async (req, res) => {
    try {
        const booking = await bookingService.updateBooking(String(req.params.id), req.body);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        (0, socket_1.emitBkgEvent)('booking.updated', {
            bookingId: booking.id,
            bookingRef: booking.bookingRef,
            message: `Booking ${booking.bookingRef} was updated`,
        });
        (0, socket_1.emitBkgEvent)('calendar.updated', { bookingId: booking.id });
        res.json({ success: true, data: booking });
    }
    catch (error) {
        console.error(error);
        if (error instanceof booking_service_1.ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
};
exports.updateBooking = updateBooking;
const getTimeline = async (req, res) => {
    try {
        const timeline = await bookingService.getBookingTimeline(String(req.params.id));
        res.json({ success: true, data: timeline });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch booking timeline' });
    }
};
exports.getTimeline = getTimeline;
const confirmBooking = async (req, res) => {
    try {
        const booking = await bookingService.changeBookingStatus(String(req.params.id), 'CONFIRMED');
        (0, socket_1.emitBkgEvent)('booking.confirmed', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
        (0, socket_1.emitBkgEvent)('calendar.updated', { bookingId: booking?.id });
        res.json({ success: true, data: booking });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to confirm booking' });
    }
};
exports.confirmBooking = confirmBooking;
const startBooking = async (req, res) => {
    try {
        const booking = await bookingService.changeBookingStatus(String(req.params.id), 'IN_PROGRESS');
        (0, socket_1.emitBkgEvent)('booking.started', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
        (0, socket_1.emitBkgEvent)('calendar.updated', { bookingId: booking?.id });
        res.json({ success: true, data: booking });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to start booking' });
    }
};
exports.startBooking = startBooking;
const completeBooking = async (req, res) => {
    try {
        const booking = await bookingService.changeBookingStatus(String(req.params.id), 'COMPLETED');
        (0, socket_1.emitBkgEvent)('booking.completed', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
        (0, socket_1.emitBkgEvent)('calendar.updated', { bookingId: booking?.id });
        res.json({ success: true, data: booking });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to complete booking' });
    }
};
exports.completeBooking = completeBooking;
const cancelBooking = async (req, res) => {
    try {
        const booking = await bookingService.cancelBooking(String(req.params.id), req.body);
        (0, socket_1.emitBkgEvent)('booking.cancelled', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
        (0, socket_1.emitBkgEvent)('calendar.updated', { bookingId: booking?.id });
        res.json({ success: true, data: booking });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to cancel booking' });
    }
};
exports.cancelBooking = cancelBooking;
const addHold = async (req, res) => {
    try {
        const hold = await bookingService.holdBooking(String(req.params.id), req.body);
        (0, socket_1.emitBkgEvent)('booking.hold', { bookingId: hold?.id, message: 'Booking placed on hold' });
        (0, socket_1.emitBkgEvent)('calendar.updated', { bookingId: hold?.id });
        res.json({ success: true, data: hold });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to place booking on hold' });
    }
};
exports.addHold = addHold;
const getHoldsByBooking = async (req, res) => {
    try {
        const holds = await bookingService.getHoldsByBooking(String(req.params.id));
        res.json({ success: true, data: holds });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch holds' });
    }
};
exports.getHoldsByBooking = getHoldsByBooking;
