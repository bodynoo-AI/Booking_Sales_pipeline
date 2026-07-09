import express from 'express';
import {
  listHolds,
  createHold,
  listDeposits,
  listAllDeposits,
  createDeposit,
  updateDeposit,
  listChangeOrders,
  listAllChangeOrders,
  createChangeOrder,
  updateChangeOrder,
  getBookingHandoff,
  getAllHandoffs,
  submitBookingHandoff,
} from '../controllers/hold.controller';

const router = express.Router();

router.get('/', listHolds);
router.post('/', createHold);

router.get('/deposits', listAllDeposits);
router.patch('/deposits/:id', updateDeposit);
router.get('/:bookingId/deposit-schedule', listDeposits);
router.post('/:bookingId/deposit-schedule', createDeposit);

router.get('/change-orders', listAllChangeOrders);
router.patch('/change-orders/:id', updateChangeOrder);
router.get('/:bookingId/change-orders', listChangeOrders);
router.post('/:bookingId/change-orders', createChangeOrder);

router.get('/handoffs', getAllHandoffs);
router.get('/:bookingId/handoff', getBookingHandoff);
router.post('/:bookingId/handoff', submitBookingHandoff);

export default router;
