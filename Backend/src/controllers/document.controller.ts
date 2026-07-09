import { Request, Response } from 'express';
import prisma from '../config/prisma';
import fs from 'fs';
import path from 'path';
import * as bookingService from '../services/booking.service';
import { PdfDocumentBuilder } from '../utils/pdfBuilder';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.id);
    const file = (req as any).file;
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return res.status(400).json({ success: false, message: 'Unsupported file type' });
    if (file.size > 10 * 1024 * 1024) return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });

    // prevent duplicates by name+size
    const existing = await prisma.bookingDocument.findFirst({ where: { bookingId, name: file.originalname } });
    if (existing) return res.status(409).json({ success: false, message: 'Document with same name already exists' });

    const dest = path.join(UPLOAD_DIR, `${Date.now()}-${file.originalname}`);
    fs.writeFileSync(dest, file.buffer);

    const doc = await prisma.bookingDocument.create({
      data: {
        bookingId,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: dest,
        uploadedBy: (req as any).user?.email || 'system',
      },
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

export const listDocuments = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.id);
    const docs = await prisma.bookingDocument.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: docs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to list documents' });
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.docId || req.params.id);
    const doc = await prisma.bookingDocument.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (!fs.existsSync(doc.path)) return res.status(404).json({ success: false, message: 'File missing on server' });

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    const stream = fs.createReadStream(doc.path);
    stream.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Download failed' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.docId || req.params.id);
    const doc = await prisma.bookingDocument.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (fs.existsSync(doc.path)) fs.unlinkSync(doc.path);
    await prisma.bookingDocument.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// ─── Generated booking documents (Confirmation Letter / Work Order / Event Brief) ──
const DOCUMENT_TYPES: Record<string, { title: string; filenamePrefix: string }> = {
  confirmation: { title: 'Booking Confirmation Letter', filenamePrefix: 'confirmation-letter' },
  'work-order': { title: 'Internal Work Order', filenamePrefix: 'work-order' },
  'event-brief': { title: 'Event Brief', filenamePrefix: 'event-brief' },
};

const buildConfirmationLetter = (booking: any) =>
  new PdfDocumentBuilder()
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

const buildWorkOrder = (booking: any) =>
  new PdfDocumentBuilder()
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

const buildEventBrief = (booking: any) =>
  new PdfDocumentBuilder()
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

export const generateBookingDocument = async (req: Request, res: Response) => {
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

    let pdfBuffer: Buffer;
    if (type === 'confirmation') pdfBuffer = buildConfirmationLetter(booking);
    else if (type === 'work-order') pdfBuffer = buildWorkOrder(booking);
    else pdfBuffer = buildEventBrief(booking);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${meta.filenamePrefix}-${booking.bookingRef}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Document generation failed' });
  }
};
