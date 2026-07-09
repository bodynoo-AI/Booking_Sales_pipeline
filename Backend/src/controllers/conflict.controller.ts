import type { Request, Response } from 'express';
import * as conflictService from '../services/conflict.service';

export const listConflicts = async (_req: Request, res: Response) => {
  try {
    const conflicts = await conflictService.getAllConflicts();
    res.json({ success: true, data: conflicts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch conflicts' });
  }
};

export const checkConflicts = async (req: Request, res: Response) => {
  try {
    const conflicts = await conflictService.checkConflicts(req.body);
    res.json({ success: true, data: conflicts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to check conflicts' });
  }
};
