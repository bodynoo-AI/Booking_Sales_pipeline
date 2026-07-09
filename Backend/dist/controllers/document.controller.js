"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingDocument = exports.deleteDocument = exports.downloadDocument = exports.listDocuments = exports.uploadDocument = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bookingService = __importStar(require("../services/booking.service"));
const pdfBuilder_1 = require("../utils/pdfBuilder");
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const uploadDocument = async (req, res) => {
    try {
        const bookingId = String(req.params.id);
        const file = req.file;
        if (!file)
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext))
            return res.status(400).json({ success: false, message: 'Unsupported file type' });
        if (file.size > 10 * 1024 * 1024)
            return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
        // prevent duplicates by name+size
        const existing = await prisma_1.default.bookingDocument.findFirst({ where: { bookingId, name: file.originalname } });
        if (existing)
            return res.status(409).json({ success: false, message: 'Document with same name already exists' });
        const dest = path_1.default.join(UPLOAD_DIR, `${Date.now()}-${file.originalname}`);
        fs_1.default.writeFileSync(dest, file.buffer);
        const doc = await prisma_1.default.bookingDocument.create({
            data: {
                bookingId,
                name: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                path: dest,
                uploadedBy: req.user?.email || 'system',
            },
        });
        return res.status(201).json({ success: true, data: doc });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Upload failed' });
    }
};
exports.uploadDocument = uploadDocument;
const listDocuments = async (req, res) => {
    try {
        const bookingId = String(req.params.id);
        const docs = await prisma_1.default.bookingDocument.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: docs });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to list documents' });
    }
};
exports.listDocuments = listDocuments;
const downloadDocument = async (req, res) => {
    try {
        const id = String(req.params.docId || req.params.id);
        const doc = await prisma_1.default.bookingDocument.findUnique({ where: { id } });
        if (!doc)
            return res.status(404).json({ success: false, message: 'Document not found' });
        if (!fs_1.default.existsSync(doc.path))
            return res.status(404).json({ success: false, message: 'File missing on server' });
        res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
        const stream = fs_1.default.createReadStream(doc.path);
        stream.pipe(res);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Download failed' });
    }
};
exports.downloadDocument = downloadDocument;
const deleteDocument = async (req, res) => {
    try {
        const id = String(req.params.docId || req.params.id);
        const doc = await prisma_1.default.bookingDocument.findUnique({ where: { id } });
        if (!doc)
            return res.status(404).json({ success: false, message: 'Document not found' });
        if (fs_1.default.existsSync(doc.path))
            fs_1.default.unlinkSync(doc.path);
        await prisma_1.default.bookingDocument.delete({ where: { id } });
        return res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Delete failed' });
    }
};
exports.deleteDocument = deleteDocument;
// ─── Generated booking documents (Confirmation Letter / Work Order / Event Brief) ──
const DOCUMENT_TYPES = {
    confirmation: { title: 'Booking Confirmation Letter', filenamePrefix: 'confirmation-letter' },
    'work-order': { title: 'Internal Work Order', filenamePrefix: 'work-order' },
    'event-brief': { title: 'Event Brief', filenamePrefix: 'event-brief' },
};
const buildConfirmationLetter = (booking) => new pdfBuilder_1.PdfDocumentBuilder()
    .title('Booking Confirmation Letter')
    .subtitle(`Booking #${booking.bookingRef}`)
    .heading('Dear ' + (booking.client?.name || 'Client'))
    .text('We are pleased to confirm the details of your upcoming event with EventHub360.')
    .spacer()
    .heading('Event Details')
    .row('Event Title', booking.eventTitle)
    .row('Quotation ID', booking.quotationId)
    .row('Venue', booking.venue)
    .row('Start Date', new Date(booking.startDate).toLocaleDateString())
    .row('End Date', new Date(booking.endDate).toLocaleDateString())
    .row('Duration', booking.durationLabel)
    .row('Guest Count', booking.guestCount != null ? String(booking.guestCount) : null)
    .heading('Commercials')
    .row('Total Revenue', `Rs. ${Number(booking.revenue ?? 0).toLocaleString('en-IN')}`)
    .row('Deposit Paid', `Rs. ${Number(booking.depositPaid ?? 0).toLocaleString('en-IN')}`)
    .spacer()
    .text('Thank you for choosing EventHub360. Our team looks forward to delivering a great event.')
    .build();
const buildWorkOrder = (booking) => new pdfBuilder_1.PdfDocumentBuilder()
    .title('Internal Work Order')
    .subtitle(`Booking #${booking.bookingRef} \u00b7 Operations Copy`)
    .heading('Logistics')
    .row('Event Title', booking.eventTitle)
    .row('Venue', booking.venue)
    .row('Venue Type', booking.venueType)
    .row('Start Date', new Date(booking.startDate).toLocaleString())
    .row('End Date', new Date(booking.endDate).toLocaleString())
    .row('Guest Count', booking.guestCount != null ? String(booking.guestCount) : null)
    .row('Assigned To', booking.assignedTo || 'Unassigned')
    .heading('Client Contact')
    .row('Client Name', booking.client?.name)
    .row('Client Phone', booking.client?.phone)
    .row('Client Email', booking.client?.email)
    .heading('Operational Notes')
    .text(booking.notes || 'No special requirements noted.')
    .build();
const buildEventBrief = (booking) => new pdfBuilder_1.PdfDocumentBuilder()
    .title('Event Brief')
    .subtitle(`Booking #${booking.bookingRef}`)
    .heading('Overview')
    .row('Event Title', booking.eventTitle)
    .row('Status', booking.status)
    .row('Venue', booking.venue)
    .row('Dates', `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`)
    .row('Duration', booking.durationLabel)
    .row('Expected Guests', booking.guestCount != null ? String(booking.guestCount) : null)
    .heading('Client')
    .row('Name', booking.client?.name)
    .row('Email', booking.client?.email)
    .heading('Brief Notes')
    .text(booking.notes || 'No additional notes provided for this event.')
    .build();
const generateBookingDocument = async (req, res) => {
    try {
        const bookingId = String(req.params.id);
        const type = String(req.params.type || '');
        const meta = DOCUMENT_TYPES[type];
        if (!meta) {
            return res.status(400).json({ success: false, message: 'Unknown document type' });
        }
        const booking = await bookingService.getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        let pdfBuffer;
        if (type === 'confirmation')
            pdfBuffer = buildConfirmationLetter(booking);
        else if (type === 'work-order')
            pdfBuffer = buildWorkOrder(booking);
        else
            pdfBuffer = buildEventBrief(booking);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${meta.filenamePrefix}-${booking.bookingRef}.pdf"`);
        return res.send(pdfBuffer);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Document generation failed' });
    }
};
exports.generateBookingDocument = generateBookingDocument;
