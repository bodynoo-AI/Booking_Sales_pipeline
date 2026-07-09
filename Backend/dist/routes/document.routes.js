"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)();
// Generated (on-the-fly) documents: confirmation letter, work order, event brief
router.get('/:id/documents/generate/:type', auth_middleware_1.default, document_controller_1.generateBookingDocument);
// Uploaded document management
router.get('/:id/documents', auth_middleware_1.default, document_controller_1.listDocuments);
router.post('/:id/documents', auth_middleware_1.default, upload.single('file'), document_controller_1.uploadDocument);
router.get('/documents/:docId', auth_middleware_1.default, document_controller_1.downloadDocument);
router.delete('/documents/:docId', auth_middleware_1.default, document_controller_1.deleteDocument);
exports.default = router;
