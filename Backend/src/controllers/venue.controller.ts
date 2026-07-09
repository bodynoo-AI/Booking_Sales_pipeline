import { Request, Response } from 'express';
import * as venueService from '../services/venue.service';

export const listVenues = async (_req: Request, res: Response) => {
  try {
    const venues = await venueService.listVenues();
    res.json({ success: true, data: venues });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch venues' });
  }
};

export const createVenue = async (req: Request, res: Response) => {
  try {
    const venue = await venueService.createVenue(req.body);
    res.status(201).json({ success: true, data: venue });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create venue' });
  }
};
