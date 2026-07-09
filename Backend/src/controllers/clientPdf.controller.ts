import { Request, Response } from 'express';
import * as bookingService from '../services/booking.service';
import { PdfDocumentBuilder } from '../utils/pdfBuilder';

const buildClientDetailsPdf = (booking: any) => {
  const doc = new PdfDocumentBuilder()
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

export const generateClientDetailsPdf = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'PDF generation failed' });
  }
};
