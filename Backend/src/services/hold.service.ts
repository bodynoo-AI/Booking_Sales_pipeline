import prisma from '../config/prisma';

const db: any = prisma;

const createBookingActivity = async (
  bookingId: string,
  action: string,
  description: string,
  status?: string,
  metadata?: any
) =>
  db.bookingActivity.create({
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

export const getAllHolds = async () =>
  prisma.hold.findMany({ include: { booking: { include: { client: true } } }, orderBy: { createdAt: 'desc' } });

export const createHold = async (data: any) => {
  const hold = await prisma.hold.create({
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

  await createBookingActivity(
    data.bookingId,
    'Hold Placed',
    `Hold created for booking ${hold.booking.bookingRef}`,
    'ON_HOLD',
    { holdId: hold.id }
  );

  return hold;
};

export const getDepositsByBooking = async (bookingId: string) =>
  prisma.depositSchedule.findMany({
    where: { bookingId },
    orderBy: { dueDate: 'asc' },
  });

export const getAllDeposits = async () =>
  prisma.depositSchedule.findMany({ include: { booking: { include: { client: true } } }, orderBy: { dueDate: 'asc' } });

export const createDeposit = async (bookingId: string, data: any) => {
  const deposit = await prisma.depositSchedule.create({
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

  await createBookingActivity(
    bookingId,
    'Deposit Scheduled',
    `Deposit of $${Number(data.amount).toFixed(2)} scheduled`,
    deposit.status,
    { depositId: deposit.id }
  );

  return deposit;
};

export const updateDeposit = async (depositId: string, data: any) => {
  const existing = await prisma.depositSchedule.findUnique({ where: { id: depositId } });
  if (!existing) return null;

  const updateData: any = {
    amount: data.amount !== undefined ? Number(data.amount) : existing.amount,
    dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
    paidDate: data.paidDate !== undefined ? (data.paidDate ? new Date(data.paidDate) : null) : existing.paidDate,
    status: data.status ?? existing.status,
    method: data.method !== undefined ? data.method : existing.method,
    reference: data.reference !== undefined ? data.reference : existing.reference,
    notes: data.notes !== undefined ? data.notes : existing.notes,
  };

  const deposit = await prisma.depositSchedule.update({
    where: { id: depositId },
    data: updateData,
  });

  await createBookingActivity(
    deposit.bookingId,
    'Deposit Updated',
    `Deposit of $${Number(deposit.amount).toFixed(2)} updated to status ${deposit.status}`,
    deposit.status,
    { depositId: deposit.id }
  );

  return deposit;
};

export const getChangeOrdersByBooking = async (bookingId: string) =>
  prisma.changeOrder.findMany({ where: { bookingId }, orderBy: { createdAt: 'desc' } });

export const createChangeOrder = async (bookingId: string, data: any) => {
  const changeOrder = await prisma.changeOrder.create({
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

  await createBookingActivity(
    bookingId,
    'Change Order Created',
    `Change order '${changeOrder.title}' created`,
    changeOrder.status,
    { changeOrderId: changeOrder.id, amountDelta: changeOrder.amountDelta }
  );

  return changeOrder;
};

export const updateChangeOrder = async (changeOrderId: string, data: any) => {
  const existing = await prisma.changeOrder.findUnique({ where: { id: changeOrderId } });
  if (!existing) return null;

  const updateData: any = {
    title: data.title ?? existing.title,
    description: data.description ?? existing.description,
    amountDelta: data.amountDelta !== undefined ? Number(data.amountDelta) : existing.amountDelta,
    requestedBy: data.requestedBy ?? existing.requestedBy,
    status: data.status ?? existing.status,
    approvedBy: data.approvedBy !== undefined ? data.approvedBy : existing.approvedBy,
  };

  const changeOrder = await prisma.changeOrder.update({
    where: { id: changeOrderId },
    data: updateData,
  });

  await createBookingActivity(
    changeOrder.bookingId,
    'Change Order Updated',
    `Change order '${changeOrder.title}' ${data.status ? `marked ${data.status}` : 'updated'}`,
    changeOrder.status,
    { changeOrderId: changeOrder.id, amountDelta: changeOrder.amountDelta }
  );

  return changeOrder;
};

export const getAllChangeOrders = async () =>
  prisma.changeOrder.findMany({ include: { booking: true }, orderBy: { createdAt: 'desc' } });

export const getBookingHandoff = async (bookingId: string) =>
  prisma.bookingHandoff.findUnique({ where: { bookingId }, include: { booking: true } });

export const submitBookingHandoff = async (bookingId: string, data: any) =>
  prisma.bookingHandoff.upsert({
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

export const submitBookingHandoffWithActivity = async (bookingId: string, data: any) => {
  const handoff = await prisma.bookingHandoff.upsert({
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

export const getAllHandoffs = async () =>
  prisma.bookingHandoff.findMany({ orderBy: { handoffAt: 'desc' } });
