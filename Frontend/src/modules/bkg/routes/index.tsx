import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BkgLayout from '../components/BkgLayout';
import DashboardScreen from '../dashboard/DashboardScreen';
import BookingListScreen from '../bookings/BookingListScreen';
import BookingDetailsScreen from '../bookings/BookingDetailsScreen';
import CreateBookingWizard from '../bookings/CreateBookingWizard';
import CalendarScreen from '../screens/CalendarScreen';
import DepositScheduleScreen from '../screens/DepositScheduleScreen';
import HoldManagementScreen from '../screens/HoldManagementScreen';
import ConflictScreen from '../screens/ConflictScreen';
import ChangeOrdersScreen from '../screens/ChangeOrdersScreen';
import CancellationsScreen from '../screens/CancellationsScreen';
import HandoffScreen from '../screens/HandoffScreen';
import ReportsScreen from '../screens/ReportsScreen';
import VenueScreen from '../screens/VenueScreen';

const BkgRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<BkgLayout />}>
      <Route index element={<DashboardScreen />} />
      <Route path="bookings" element={<BookingListScreen />} />
      <Route path="bookings/new" element={<CreateBookingWizard />} />
      <Route path="bookings/edit/:id" element={<CreateBookingWizard />} />
      <Route path="bookings/:id" element={<BookingDetailsScreen />} />
      <Route path="holds" element={<HoldManagementScreen />} />
      <Route path="conflicts" element={<ConflictScreen />} />
      <Route path="calendar" element={<CalendarScreen />} />
      <Route path="deposits" element={<DepositScheduleScreen />} />
      <Route path="change-orders" element={<ChangeOrdersScreen />} />
      <Route path="cancellations" element={<CancellationsScreen />} />
      <Route path="documents" element={<HandoffScreen />} />
      <Route path="venues" element={<VenueScreen />} />
      <Route path="reports" element={<ReportsScreen />} />
      <Route path="*" element={<Navigate to="/bkg" replace />} />
    </Route>
  </Routes>
);

export default BkgRoutes;
