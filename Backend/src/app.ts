import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/booking.routes';
import documentRoutes from './routes/document.routes';
import dashboardRoutes from './routes/dashboard.routes';
import conflictRoutes from './routes/conflict.routes';
import calendarRoutes from './routes/calendar.routes';
import venueRoutes from './routes/venue.routes';
// use require() for a few route modules to avoid TS resolution issues with dotted filenames
const holdRoutes = require('./routes/hold.routes').default as any;
const reportRoutes = require('./routes/report.routes').default as any;

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/bkg/bookings', bookingRoutes);
// document routes are mounted on the same /bkg/bookings prefix since they are
// sub-resources of a booking (e.g. /bkg/bookings/:id/documents)
app.use('/api/bkg/bookings', documentRoutes);
app.use('/api/bkg/dashboard', dashboardRoutes);
app.use('/api/bkg/conflicts', conflictRoutes);
app.use('/api/bkg/calendar', calendarRoutes);
app.use('/api/bkg/venues', venueRoutes);
app.use('/api/bkg/holds', holdRoutes);
app.use('/api/bkg/reports', reportRoutes);

export default app;