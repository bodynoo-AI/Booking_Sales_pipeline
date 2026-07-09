import express from 'express';
import { getEvents } from '../controllers/calendar.controller';

const router = express.Router();

router.get('/', getEvents);

export default router;
