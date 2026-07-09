import type { Request, Response } from 'express';
import * as calendarService from '../services/calendar.service';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query as { month?: string; year?: string };
    const events = await calendarService.getEvents({ month, year });
    res.json({ success: true, data: events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar events' });
  }
};
