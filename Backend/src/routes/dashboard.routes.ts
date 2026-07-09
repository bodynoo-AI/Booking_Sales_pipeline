import express from 'express';
import {
  getStats,
  getAlerts,
  getCalendarSummary,
} from '../controllers/dashboard.controller';

const router = express.Router();

router.get('/', getStats);
router.get('/alerts', getAlerts);
router.get('/calendar-summary', getCalendarSummary);

export default router;
