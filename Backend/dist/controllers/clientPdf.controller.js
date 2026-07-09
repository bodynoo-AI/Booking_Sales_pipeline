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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClientDetailsPdf = void 0;
const bookingService = __importStar(require("../services/booking.service"));
const pdfBuilder_1 = require("../utils/pdfBuilder");
const buildClientDetailsPdf = (booking) => {
    const doc = new pdfBuilder_1.PdfDocumentBuilder()
        .title('Client Details Report')
        .subtitle(`Booking #${booking.bookingRef} \u00b7 ${booking.eventTitle}`)
        .heading('Booking Summary')
        .row('Booking Ref', booking.bookingRef)
        .row('Quotation ID', booking.quotationId)
        .row('Event Title', booking.eventTitle)
        .row('Status', booking.status)
        .row('Venue', booking.venue)
        .row('Start Date', new Date(booking.startDate).toLocaleDateString())
        .row('End Date', new Date(booking.endDate).toLocaleDateString())
        .heading('Client Information')
        .row('Client Name', booking.client?.name)
        .row('Client Email', booking.client?.email)
        .row('Client Phone', booking.client?.phone)
        .heading('Commercials')
        .row('Assigned To', booking.assignedTo || 'Unassigned')
        .row('Revenue', `Rs. ${Number(booking.revenue ?? 0).toLocaleString('en-IN')}`)
        .heading('Notes')
        .text(booking.notes || 'No notes provided');
    return doc.build();
};
const generateClientDetailsPdf = async (req, res) => {
    try {
        const bookingId = String(req.params.id);
        const booking = await bookingService.getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        const pdfBuffer = buildClientDetailsPdf(booking);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="client-details-${booking.bookingRef}.pdf"`);
        return res.send(pdfBuffer);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'PDF generation failed' });
    }
};
exports.generateClientDetailsPdf = generateClientDetailsPdf;
