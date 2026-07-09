import express from 'express';
import { createVenue, listVenues } from '../controllers/venue.controller';

const router = express.Router();

router.get('/', listVenues);
router.post('/', createVenue);

export default router;
