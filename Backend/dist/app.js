"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const conflict_routes_1 = __importDefault(require("./routes/conflict.routes"));
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
const venue_routes_1 = __importDefault(require("./routes/venue.routes"));
// use require() for a few route modules to avoid TS resolution issues with dotted filenames
const holdRoutes = require('./routes/hold.routes').default;
const reportRoutes = require('./routes/report.routes').default;
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/auth', auth_routes_1.default);
app.use('/api/bkg/bookings', booking_routes_1.default);
// document routes are mounted on the same /bkg/bookings prefix since they are
// sub-resources of a booking (e.g. /bkg/bookings/:id/documents)
app.use('/api/bkg/bookings', document_routes_1.default);
app.use('/api/bkg/dashboard', dashboard_routes_1.default);
app.use('/api/bkg/conflicts', conflict_routes_1.default);
app.use('/api/bkg/calendar', calendar_routes_1.default);
app.use('/api/bkg/venues', venue_routes_1.default);
app.use('/api/bkg/holds', holdRoutes);
app.use('/api/bkg/reports', reportRoutes);
exports.default = app;
