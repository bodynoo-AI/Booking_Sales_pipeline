import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument,
  generateBookingDocument,
} from '../controllers/document.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = express.Router();
const upload = multer();

// Generated (on-the-fly) documents: confirmation letter, work order, event brief
router.get('/:id/documents/generate/:type', authMiddleware, generateBookingDocument);

// Uploaded document management
router.get('/:id/documents', authMiddleware, listDocuments);
router.post('/:id/documents', authMiddleware, upload.single('file'), uploadDocument);
router.get('/documents/:docId', authMiddleware, downloadDocument);
router.delete('/documents/:docId', authMiddleware, deleteDocument);

export default router;
