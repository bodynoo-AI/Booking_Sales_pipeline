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
exports.getConversionTimeReport = exports.getCancellationReport = exports.getCalendarUtilisationReport = exports.getRegisterReport = void 0;
const reportService = __importStar(require("../services/report.service"));
const getRegisterReport = async (req, res) => {
    try {
        const report = await reportService.getRegisterReport(req.query);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch register report' });
    }
};
exports.getRegisterReport = getRegisterReport;
const getCalendarUtilisationReport = async (req, res) => {
    try {
        const report = await reportService.getCalendarUtilisationReport(req.query);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch calendar utilisation report' });
    }
};
exports.getCalendarUtilisationReport = getCalendarUtilisationReport;
const getCancellationReport = async (req, res) => {
    try {
        const report = await reportService.getCancellationReport(req.query);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch cancellation report' });
    }
};
exports.getCancellationReport = getCancellationReport;
const getConversionTimeReport = async (req, res) => {
    try {
        const report = await reportService.getConversionTimeReport(req.query);
        res.json({ success: true, data: report });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch conversion time report' });
    }
};
exports.getConversionTimeReport = getConversionTimeReport;
