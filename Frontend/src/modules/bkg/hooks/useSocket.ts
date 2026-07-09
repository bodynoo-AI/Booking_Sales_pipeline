import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import { queryKeys } from './index';

type SocketEvent =
  | 'booking.created'
  | 'booking.updated'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'hold.expiring'
  | 'hold.expired'
  | 'calendar.updated'
  | 'booking.started'
  | 'booking.completed'
  | 'booking.hold'
  | 'hold.created'
  | 'deposit.scheduled'
  | 'deposit.updated'
  | 'changeorder.created'
  | 'changeorder.updated'
  | 'handoff.submitted';

interface SocketPayload {
  bookingId?: string;
  holdId?: string;
  message?: string;
  data?: unknown;
}

export const useBkgSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const socket = io('/bkg', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[BKG Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[BKG Socket] Disconnected');
    });

    const handleEvent = (event: SocketEvent, payload: SocketPayload) => {
      switch (event) {
        case 'booking.created':
          qc.invalidateQueries({ queryKey: ['bookings'] });
          qc.invalidateQueries({ queryKey: queryKeys.dashboard });
          notification.info({ message: 'New Booking', description: payload.message || 'A new booking has been created.' });
          break;

        case 'booking.updated':
          if (payload.bookingId) {
            qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId) });
          }
          qc.invalidateQueries({ queryKey: ['bookings'] });
          break;

        case 'booking.confirmed':
          if (payload.bookingId) {
            qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId) });
          }
          notification.success({ message: 'Booking Confirmed', description: payload.message });
          break;

        case 'booking.started':
          if (payload.bookingId) qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId) });
          notification.info({ message: 'Event Started', description: payload.message || 'An event has started.' });
          break;

        case 'booking.completed':
          if (payload.bookingId) qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId) });
          qc.invalidateQueries({ queryKey: ['bookings'] });
          notification.success({ message: 'Event Completed', description: payload.message || 'An event has completed.' });
          break;

        case 'booking.hold':
        case 'hold.created':
          qc.invalidateQueries({ queryKey: ['bookings'] });
          qc.invalidateQueries({ queryKey: queryKeys.holds() });
          notification.info({ message: 'Hold Placed', description: payload.message || 'A booking has been placed on hold.' });
          break;

        case 'deposit.scheduled':
          qc.invalidateQueries({ queryKey: ['deposits'] });
          qc.invalidateQueries({ queryKey: ['bookings'] });
          notification.info({ message: 'Deposit Scheduled', description: payload.message || 'A deposit has been scheduled.' });
          break;

        case 'deposit.updated':
          qc.invalidateQueries({ queryKey: ['deposits'] });
          if (payload.bookingId) qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId) });
          notification.info({ message: 'Deposit Updated', description: payload.message || 'A deposit entry has been updated.' });
          break;

        case 'changeorder.created':
          qc.invalidateQueries({ queryKey: ['changeorders'] });
          qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId || '') });
          notification.info({ message: 'Change Order', description: payload.message || 'A change order was created.' });
          break;

        case 'changeorder.updated':
          qc.invalidateQueries({ queryKey: ['changeorders'] });
          qc.invalidateQueries({ queryKey: ['change-orders'] });
          if (payload.bookingId) qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId) });
          notification.info({ message: 'Change Order Updated', description: payload.message || 'A change order has been updated.' });
          break;

        case 'handoff.submitted':
          qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId || '') });
          notification.info({ message: 'Handoff Submitted', description: payload.message || 'A handoff has been submitted.' });
          break;

        case 'booking.cancelled':
          if (payload.bookingId) {
            qc.invalidateQueries({ queryKey: queryKeys.booking(payload.bookingId) });
          }
          qc.invalidateQueries({ queryKey: ['bookings'] });
          notification.warning({ message: 'Booking Cancelled', description: payload.message });
          break;

        case 'hold.expiring':
          qc.invalidateQueries({ queryKey: queryKeys.holds() });
          notification.warning({
            message: 'Hold Expiring Soon',
            description: payload.message || 'A hold is about to expire.',
            duration: 0,
          });
          break;

        case 'hold.expired':
          qc.invalidateQueries({ queryKey: queryKeys.holds() });
          qc.invalidateQueries({ queryKey: ['bookings'] });
          notification.error({ message: 'Hold Expired', description: payload.message });
          break;

        case 'calendar.updated':
          qc.invalidateQueries({ queryKey: ['calendar'] });
          qc.invalidateQueries({ queryKey: ['reports', 'calendar-utilisation'] });
          qc.invalidateQueries({ queryKey: queryKeys.calendarSummary });
          break;
      }
    };

    const events: SocketEvent[] = [
      'booking.created',
      'booking.updated',
      'booking.confirmed',
      'booking.started',
      'booking.completed',
      'booking.cancelled',
      'booking.hold',
      'hold.created',
      'hold.expiring',
      'hold.expired',
      'calendar.updated',
      'deposit.scheduled',
      'deposit.updated',
      'changeorder.created',
      'changeorder.updated',
      'handoff.submitted',
    ];

    events.forEach((event) => {
      socket.on(event, (payload: SocketPayload) => handleEvent(event, payload));
    });

    return () => {
      socket.disconnect();
    };
  }, [qc]);

  return socketRef;
};
