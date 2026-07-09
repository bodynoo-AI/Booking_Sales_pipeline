"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const report_controller_1 = require("../controllers/report.controller");
const router = express_1.default.Router();
router.get('/register', report_controller_1.getRegisterReport);
router.get('/calendar-utilisation', report_controller_1.getCalendarUtilisationReport);
router.get('/cancellations', report_controller_1.getCancellationReport);
router.get('/conversion-time', report_controller_1.getConversionTimeReport);
exports.default = router;
