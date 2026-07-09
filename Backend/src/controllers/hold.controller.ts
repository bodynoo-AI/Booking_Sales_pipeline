import type { Request, Response } from 'express';
import * as holdService from '../services/hold.service';
import { emitBkgEvent } from '../socket';

export const listHolds = async (_req: Request, res: Response) => {
  try {
    const holds = await holdService.getAllHolds();
    res.json({ success: true, data: holds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch holds' });
  }
};

export const createHold = async (req: Request, res: Response) => {
  try {
    const hold = await holdService.createHold(req.body);
    emitBkgEvent('hold.created', { bookingId: hold.bookingId, holdId: hold.id });
    res.status(201).json({ success: true, data: hold });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create hold' });
  }
};

export const listDeposits = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId || req.params.id || req.query.bookingId);
    const deposits = await holdService.getDepositsByBooking(bookingId);
    res.json({ success: true, data: deposits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch deposit schedule' });
  }
};

export const listAllDeposits = async (_req: Request, res: Response) => {
  try {
    const deposits = await holdService.getAllDeposits();
    res.json({ success: true, data: deposits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch deposit schedule' });
  }
};

export const createDeposit = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId || req.params.id);
    const deposit = await holdService.createDeposit(bookingId, req.body);
    emitBkgEvent('deposit.scheduled', { bookingId, depositId: deposit.id });
    res.status(201).json({ success: true, data: deposit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create deposit entry' });
  }
};

export const updateDeposit = async (req: Request, res: Response) => {
  try {
    const depositId = String(req.params.depositId || req.params.id);
    const deposit = await holdService.updateDeposit(depositId, req.body);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }
    emitBkgEvent('deposit.updated', { bookingId: deposit.bookingId, depositId: deposit.id });
    res.json({ success: true, data: deposit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update deposit entry' });
  }
};

export const listChangeOrders = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId || req.params.id);
    const changeOrders = await holdService.getChangeOrdersByBooking(bookingId);
    res.json({ success: true, data: changeOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch change orders' });
  }
};

export const listAllChangeOrders = async (_req: Request, res: Response) => {
  try {
    const changeOrders = await holdService.getAllChangeOrders();
    res.json({ success: true, data: changeOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch change orders' });
  }
};

export const createChangeOrder = async (req: Request, res: Response) => {
  try {
    const changeOrder = await holdService.createChangeOrder(String(req.params.bookingId), req.body);
    emitBkgEvent('changeorder.created', { bookingId: changeOrder.bookingId, changeOrderId: changeOrder.id });
    res.status(201).json({ success: true, data: changeOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create change order' });
  }
};

export const updateChangeOrder = async (req: Request, res: Response) => {
  try {
    const changeOrderId = String(req.params.changeOrderId || req.params.id);
    const changeOrder = await holdService.updateChangeOrder(changeOrderId, req.body);
    if (!changeOrder) {
      return res.status(404).json({ success: false, message: 'Change order not found' });
    }
    emitBkgEvent('changeorder.updated', { bookingId: changeOrder.bookingId, changeOrderId: changeOrder.id });
    res.json({ success: true, data: changeOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update change order' });
  }
};

export const getBookingHandoff = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId || req.params.id);
    const handoff = await holdService.getBookingHandoff(bookingId);
    res.json({ success: true, data: handoff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch handoff data' });
  }
};

export const getAllHandoffs = async (_req: Request, res: Response) => {
  try {
    const handoffs = await holdService.getAllHandoffs();
    res.json({ success: true, data: handoffs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch handoff data' });
  }
};

export const submitBookingHandoff = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId || req.params.id);
    const handoff = await holdService.submitBookingHandoffWithActivity(bookingId, req.body);
    emitBkgEvent('handoff.submitted', { bookingId, handoffId: handoff.id });
    res.status(201).json({ success: true, data: handoff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to submit handoff data' });
  }
};
