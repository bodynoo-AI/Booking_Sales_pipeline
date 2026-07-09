"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = express_1.default.Router();
router.get('/', dashboard_controller_1.getStats);
router.get('/alerts', dashboard_controller_1.getAlerts);
router.get('/calendar-summary', dashboard_controller_1.getCalendarSummary);
exports.default = router;
