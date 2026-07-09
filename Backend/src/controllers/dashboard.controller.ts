import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

export const getAlerts = async (_req: Request, res: Response) => {
  try {
    const alerts = await dashboardService.getAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard alerts' });
  }
};

export const getCalendarSummary = async (_req: Request, res: Response) => {
  try {
    const summary = await dashboardService.getCalendarSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar summary' });
  }
};
