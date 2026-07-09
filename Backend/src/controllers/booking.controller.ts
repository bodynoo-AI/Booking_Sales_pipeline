import { Request, Response } from 'express';
import * as bookingService from '../services/booking.service';
import { ValidationError } from '../services/booking.service';
import { emitBkgEvent } from '../socket';

export const createBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    emitBkgEvent('booking.created', {
      bookingId: booking.id,
      message: `New booking ${booking.bookingRef} created`,
    });
    emitBkgEvent('calendar.updated', { bookingId: booking.id });
    // include recent bookings to allow UI to show latest entries immediately
    const recent = await bookingService.getBookings({ page: 1, limit: 5 } as any);
    res.status(201).json({ success: true, data: booking, recentBookings: recent });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
};

export const getBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getBookings(req.query as any);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBookingById(String(req.params.id));
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.updateBooking(String(req.params.id), req.body);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    emitBkgEvent('booking.updated', {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      message: `Booking ${booking.bookingRef} was updated`,
    });
    emitBkgEvent('calendar.updated', { bookingId: booking.id });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
};

export const getTimeline = async (req: Request, res: Response) => {
  try {
    const timeline = await bookingService.getBookingTimeline(String(req.params.id));
    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking timeline' });
  }
};

export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.changeBookingStatus(String(req.params.id), 'CONFIRMED');
    emitBkgEvent('booking.confirmed', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
    emitBkgEvent('calendar.updated', { bookingId: booking?.id });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to confirm booking' });
  }
};

export const startBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.changeBookingStatus(String(req.params.id), 'IN_PROGRESS');
    emitBkgEvent('booking.started', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
    emitBkgEvent('calendar.updated', { bookingId: booking?.id });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to start booking' });
  }
};

export const completeBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.changeBookingStatus(String(req.params.id), 'COMPLETED');
    emitBkgEvent('booking.completed', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
    emitBkgEvent('calendar.updated', { bookingId: booking?.id });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to complete booking' });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.cancelBooking(String(req.params.id), req.body);
    emitBkgEvent('booking.cancelled', { bookingId: booking?.id, bookingRef: booking?.bookingRef });
    emitBkgEvent('calendar.updated', { bookingId: booking?.id });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
};

export const addHold = async (req: Request, res: Response) => {
  try {
    const hold = await bookingService.holdBooking(String(req.params.id), req.body);
    emitBkgEvent('booking.hold', { bookingId: hold?.id, message: 'Booking placed on hold' });
    emitBkgEvent('calendar.updated', { bookingId: hold?.id });
    res.json({ success: true, data: hold });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to place booking on hold' });
  }
};

export const getHoldsByBooking = async (req: Request, res: Response) => {
  try {
    const holds = await bookingService.getHoldsByBooking(String(req.params.id));
    res.json({ success: true, data: holds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch holds' });
  }
};