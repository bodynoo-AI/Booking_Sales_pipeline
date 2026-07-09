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
exports.submitBookingHandoff = exports.getAllHandoffs = exports.getBookingHandoff = exports.updateChangeOrder = exports.createChangeOrder = exports.listAllChangeOrders = exports.listChangeOrders = exports.updateDeposit = exports.createDeposit = exports.listAllDeposits = exports.listDeposits = exports.createHold = exports.listHolds = void 0;
const holdService = __importStar(require("../services/hold.service"));
const socket_1 = require("../socket");
const listHolds = async (_req, res) => {
    try {
        const holds = await holdService.getAllHolds();
        res.json({ success: true, data: holds });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch holds' });
    }
};
exports.listHolds = listHolds;
const createHold = async (req, res) => {
    try {
        const hold = await holdService.createHold(req.body);
        (0, socket_1.emitBkgEvent)('hold.created', { bookingId: hold.bookingId, holdId: hold.id });
        res.status(201).json({ success: true, data: hold });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create hold' });
    }
};
exports.createHold = createHold;
const listDeposits = async (req, res) => {
    try {
        const bookingId = String(req.params.bookingId || req.params.id || req.query.bookingId);
        const deposits = await holdService.getDepositsByBooking(bookingId);
        res.json({ success: true, data: deposits });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch deposit schedule' });
    }
};
exports.listDeposits = listDeposits;
const listAllDeposits = async (_req, res) => {
    try {
        const deposits = await holdService.getAllDeposits();
        res.json({ success: true, data: deposits });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch deposit schedule' });
    }
};
exports.listAllDeposits = listAllDeposits;
const createDeposit = async (req, res) => {
    try {
        const bookingId = String(req.params.bookingId || req.params.id);
        const deposit = await holdService.createDeposit(bookingId, req.body);
        (0, socket_1.emitBkgEvent)('deposit.scheduled', { bookingId, depositId: deposit.id });
        res.status(201).json({ success: true, data: deposit });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create deposit entry' });
    }
};
exports.createDeposit = createDeposit;
const updateDeposit = async (req, res) => {
    try {
        const depositId = String(req.params.depositId || req.params.id);
        const deposit = await holdService.updateDeposit(depositId, req.body);
        if (!deposit) {
            return res.status(404).json({ success: false, message: 'Deposit not found' });
        }
        (0, socket_1.emitBkgEvent)('deposit.updated', { bookingId: deposit.bookingId, depositId: deposit.id });
        res.json({ success: true, data: deposit });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update deposit entry' });
    }
};
exports.updateDeposit = updateDeposit;
const listChangeOrders = async (req, res) => {
    try {
        const bookingId = String(req.params.bookingId || req.params.id);
        const changeOrders = await holdService.getChangeOrdersByBooking(bookingId);
        res.json({ success: true, data: changeOrders });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch change orders' });
    }
};
exports.listChangeOrders = listChangeOrders;
const listAllChangeOrders = async (_req, res) => {
    try {
        const changeOrders = await holdService.getAllChangeOrders();
        res.json({ success: true, data: changeOrders });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch change orders' });
    }
};
exports.listAllChangeOrders = listAllChangeOrders;
const createChangeOrder = async (req, res) => {
    try {
        const changeOrder = await holdService.createChangeOrder(String(req.params.bookingId), req.body);
        (0, socket_1.emitBkgEvent)('changeorder.created', { bookingId: changeOrder.bookingId, changeOrderId: changeOrder.id });
        res.status(201).json({ success: true, data: changeOrder });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create change order' });
    }
};
exports.createChangeOrder = createChangeOrder;
const updateChangeOrder = async (req, res) => {
    try {
        const changeOrderId = String(req.params.changeOrderId || req.params.id);
        const changeOrder = await holdService.updateChangeOrder(changeOrderId, req.body);
        if (!changeOrder) {
            return res.status(404).json({ success: false, message: 'Change order not found' });
        }
        (0, socket_1.emitBkgEvent)('changeorder.updated', { bookingId: changeOrder.bookingId, changeOrderId: changeOrder.id });
        res.json({ success: true, data: changeOrder });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update change order' });
    }
};
exports.updateChangeOrder = updateChangeOrder;
const getBookingHandoff = async (req, res) => {
    try {
        const bookingId = String(req.params.bookingId || req.params.id);
        const handoff = await holdService.getBookingHandoff(bookingId);
        res.json({ success: true, data: handoff });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch handoff data' });
    }
};
exports.getBookingHandoff = getBookingHandoff;
const getAllHandoffs = async (_req, res) => {
    try {
        const handoffs = await holdService.getAllHandoffs();
        res.json({ success: true, data: handoffs });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch handoff data' });
    }
};
exports.getAllHandoffs = getAllHandoffs;
const submitBookingHandoff = async (req, res) => {
    try {
        const bookingId = String(req.params.bookingId || req.params.id);
        const handoff = await holdService.submitBookingHandoffWithActivity(bookingId, req.body);
        (0, socket_1.emitBkgEvent)('handoff.submitted', { bookingId, handoffId: handoff.id });
        res.status(201).json({ success: true, data: handoff });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to submit handoff data' });
    }
};
exports.submitBookingHandoff = submitBookingHandoff;
