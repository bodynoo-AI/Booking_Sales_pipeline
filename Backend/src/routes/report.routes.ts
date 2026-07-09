import express from 'express';
import {
  getRegisterReport,
  getCalendarUtilisationReport,
  getCancellationReport,
  getConversionTimeReport,
} from '../controllers/report.controller';

const router = express.Router();

router.get('/register', getRegisterReport);
router.get('/calendar-utilisation', getCalendarUtilisationReport);
router.get('/cancellations', getCancellationReport);
router.get('/conversion-time', getConversionTimeReport);

export default router;
