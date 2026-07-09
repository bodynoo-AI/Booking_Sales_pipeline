import express from 'express';

import authMiddleware from '../middleware/auth.middleware';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  getTimeline,
  confirmBooking,
  startBooking,
  completeBooking,
  cancelBooking,
  addHold,
  getHoldsByBooking,
} from '../controllers/booking.controller';
import {
  listDeposits,
  createDeposit,
  listChangeOrders,
  createChangeOrder,
  getBookingHandoff,
  submitBookingHandoff,
} from '../controllers/hold.controller';
import { generateClientDetailsPdf } from '../controllers/clientPdf.controller';

const router = express.Router();

router.get('/', getBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.patch('/:id', updateBooking);
router.get('/:id/timeline', getTimeline);
router.post('/:id/confirm', confirmBooking);
router.post('/:id/start', startBooking);
router.post('/:id/complete', completeBooking);
router.post('/:id/cancel', cancelBooking);
router.post('/:id/hold', addHold);
router.get('/:id/hold', getHoldsByBooking);
router.get('/:id/deposit-schedule', listDeposits);
router.post('/:id/deposit-schedule', createDeposit);
router.get('/:id/change-orders', listChangeOrders);
router.post('/:id/change-orders', createChangeOrder);
router.get('/:id/handoff', getBookingHandoff);
router.post('/:id/handoff', submitBookingHandoff);
router.get('/:id/client-pdf', authMiddleware, generateClientDetailsPdf);

export default router;