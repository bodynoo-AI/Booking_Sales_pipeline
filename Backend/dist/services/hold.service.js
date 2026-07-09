"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllHandoffs = exports.submitBookingHandoffWithActivity = exports.submitBookingHandoff = exports.getBookingHandoff = exports.getAllChangeOrders = exports.updateChangeOrder = exports.createChangeOrder = exports.getChangeOrdersByBooking = exports.updateDeposit = exports.createDeposit = exports.getAllDeposits = exports.getDepositsByBooking = exports.createHold = exports.getAllHolds = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const db = prisma_1.default;
const createBookingActivity = async (bookingId, action, description, status, metadata) => db.bookingActivity.create({
    data: {
        bookingId,
        action,
        description,
        performedBy: 'Operations',
        status,
        metadata: metadata ?? undefined,
        timestamp: new Date(),
    },
});
const getAllHolds = async () => prisma_1.default.hold.findMany({ include: { booking: { include: { client: true } } }, orderBy: { createdAt: 'desc' } });
exports.getAllHolds = getAllHolds;
const createHold = async (data) => {
    const hold = await prisma_1.default.hold.create({
        data: {
            booking: { connect: { id: data.bookingId } },
            reason: data.reason,
            heldBy: data.heldBy,
            expiresAt: new Date(data.expiresAt),
            status: data.status || 'ACTIVE',
            notes: data.notes,
        },
        include: { booking: { include: { client: true } } },
    });
    await createBookingActivity(data.bookingId, 'Hold Placed', `Hold created for booking ${hold.booking.bookingRef}`, 'ON_HOLD', { holdId: hold.id });
    return hold;
};
exports.createHold = createHold;
const getDepositsByBooking = async (bookingId) => prisma_1.default.depositSchedule.findMany({
    where: { bookingId },
    orderBy: { dueDate: 'asc' },
});
exports.getDepositsByBooking = getDepositsByBooking;
const getAllDeposits = async () => prisma_1.default.depositSchedule.findMany({ include: { booking: { include: { client: true } } }, orderBy: { dueDate: 'asc' } });
exports.getAllDeposits = getAllDeposits;
const createDeposit = async (bookingId, data) => {
    const deposit = await prisma_1.default.depositSchedule.create({
        data: {
            booking: { connect: { id: bookingId } },
            amount: Number(data.amount),
            dueDate: new Date(data.dueDate),
            paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
            status: data.status || 'PENDING',
            method: data.method,
            reference: data.reference,
            notes: data.notes,
        },
    });
    await createBookingActivity(bookingId, 'Deposit Scheduled', `Deposit of $${Number(data.amount).toFixed(2)} scheduled`, deposit.status, { depositId: deposit.id });
    return deposit;
};
exports.createDeposit = createDeposit;
const updateDeposit = async (depositId, data) => {
    const existing = await prisma_1.default.depositSchedule.findUnique({ where: { id: depositId } });
    if (!existing)
        return null;
    const updateData = {
        amount: data.amount !== undefined ? Number(data.amount) : existing.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
        paidDate: data.paidDate !== undefined ? (data.paidDate ? new Date(data.paidDate) : null) : existing.paidDate,
        status: data.status ?? existing.status,
        method: data.method !== undefined ? data.method : existing.method,
        reference: data.reference !== undefined ? data.reference : existing.reference,
        notes: data.notes !== undefined ? data.notes : existing.notes,
    };
    const deposit = await prisma_1.default.depositSchedule.update({
        where: { id: depositId },
        data: updateData,
    });
    await createBookingActivity(deposit.bookingId, 'Deposit Updated', `Deposit of $${Number(deposit.amount).toFixed(2)} updated to status ${deposit.status}`, deposit.status, { depositId: deposit.id });
    return deposit;
};
exports.updateDeposit = updateDeposit;
const getChangeOrdersByBooking = async (bookingId) => prisma_1.default.changeOrder.findMany({ where: { bookingId }, orderBy: { createdAt: 'desc' } });
exports.getChangeOrdersByBooking = getChangeOrdersByBooking;
const createChangeOrder = async (bookingId, data) => {
    const changeOrder = await prisma_1.default.changeOrder.create({
        data: {
            booking: { connect: { id: bookingId } },
            title: data.title,
            description: data.description,
            amountDelta: Number(data.amountDelta),
            requestedBy: data.requestedBy,
            status: data.status || 'PENDING',
            approvedBy: data.approvedBy,
        },
    });
    await createBookingActivity(bookingId, 'Change Order Created', `Change order '${changeOrder.title}' created`, changeOrder.status, { changeOrderId: changeOrder.id, amountDelta: changeOrder.amountDelta });
    return changeOrder;
};
exports.createChangeOrder = createChangeOrder;
const updateChangeOrder = async (changeOrderId, data) => {
    const existing = await prisma_1.default.changeOrder.findUnique({ where: { id: changeOrderId } });
    if (!existing)
        return null;
    const updateData = {
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        amountDelta: data.amountDelta !== undefined ? Number(data.amountDelta) : existing.amountDelta,
        requestedBy: data.requestedBy ?? existing.requestedBy,
        status: data.status ?? existing.status,
        approvedBy: data.approvedBy !== undefined ? data.approvedBy : existing.approvedBy,
    };
    const changeOrder = await prisma_1.default.changeOrder.update({
        where: { id: changeOrderId },
        data: updateData,
    });
    await createBookingActivity(changeOrder.bookingId, 'Change Order Updated', `Change order '${changeOrder.title}' ${data.status ? `marked ${data.status}` : 'updated'}`, changeOrder.status, { changeOrderId: changeOrder.id, amountDelta: changeOrder.amountDelta });
    return changeOrder;
};
exports.updateChangeOrder = updateChangeOrder;
const getAllChangeOrders = async () => prisma_1.default.changeOrder.findMany({ include: { booking: true }, orderBy: { createdAt: 'desc' } });
exports.getAllChangeOrders = getAllChangeOrders;
const getBookingHandoff = async (bookingId) => prisma_1.default.bookingHandoff.findUnique({ where: { bookingId }, include: { booking: true } });
exports.getBookingHandoff = getBookingHandoff;
const submitBookingHandoff = async (bookingId, data) => prisma_1.default.bookingHandoff.upsert({
    where: { bookingId },
    update: {
        handoffTo: data.handoffTo,
        checklist: data.checklist || [],
        notes: data.notes,
        handoffAt: new Date(data.handoffAt),
    },
    create: {
        booking: { connect: { id: bookingId } },
        handoffTo: data.handoffTo,
        checklist: data.checklist || [],
        notes: data.notes,
        handoffAt: new Date(data.handoffAt),
    },
});
exports.submitBookingHandoff = submitBookingHandoff;
const submitBookingHandoffWithActivity = async (bookingId, data) => {
    const handoff = await prisma_1.default.bookingHandoff.upsert({
        where: { bookingId },
        update: {
            handoffTo: data.handoffTo,
            checklist: data.checklist || [],
            notes: data.notes,
            handoffAt: new Date(data.handoffAt),
        },
        create: {
            booking: { connect: { id: bookingId } },
            handoffTo: data.handoffTo,
            checklist: data.checklist || [],
            notes: data.notes,
            handoffAt: new Date(data.handoffAt),
        },
    });
    if (handoff) {
        await createBookingActivity(bookingId, 'Handoff Submitted', `Handoff submitted to ${handoff.handoffTo}`, undefined, { handoffId: handoff.id });
    }
    return handoff;
};
exports.submitBookingHandoffWithActivity = submitBookingHandoffWithActivity;
const getAllHandoffs = async () => prisma_1.default.bookingHandoff.findMany({ orderBy: { handoffAt: 'desc' } });
exports.getAllHandoffs = getAllHandoffs;
