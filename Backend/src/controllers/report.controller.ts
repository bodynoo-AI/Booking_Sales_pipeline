import type { Request, Response } from 'express';
import * as reportService from '../services/report.service';

export const getRegisterReport = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getRegisterReport(req.query as Record<string, string>);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch register report' });
  }
};

export const getCalendarUtilisationReport = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getCalendarUtilisationReport(req.query as Record<string, string>);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar utilisation report' });
  }
};

export const getCancellationReport = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getCancellationReport(req.query as Record<string, string>);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch cancellation report' });
  }
};

export const getConversionTimeReport = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getConversionTimeReport(req.query as Record<string, string>);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversion time report' });
  }
};
