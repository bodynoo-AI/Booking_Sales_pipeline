import express from 'express';
import { checkConflicts, listConflicts } from '../controllers/conflict.controller';

const router = express.Router();

router.get('/', listConflicts);
router.post('/check', checkConflicts);

export default router;
