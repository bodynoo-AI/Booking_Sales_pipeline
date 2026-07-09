"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVenue = exports.listVenues = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const listVenues = async () => {
    return prisma.venue.findMany({
        orderBy: { createdAt: 'desc' },
    });
};
exports.listVenues = listVenues;
const createVenue = async (data) => {
    const name = data.name?.trim();
    if (!name) {
        throw new Error('Venue name is required');
    }
    const existing = await prisma.venue.findUnique({ where: { name } });
    if (existing) {
        return existing;
    }
    return prisma.venue.create({
        data: {
            name,
            city: data.city?.trim() || null,
            address: data.address?.trim() || null,
            capacity: data.capacity ? Number(data.capacity) : null,
            type: data.type?.trim() || 'General',
            description: data.description?.trim() || null,
            status: data.status?.trim() || 'ACTIVE',
        },
    });
};
exports.createVenue = createVenue;
