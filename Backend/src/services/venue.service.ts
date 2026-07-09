import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface VenuePayload {
  name: string;
  city?: string;
  address?: string;
  capacity?: number;
  type?: string;
  description?: string;
  status?: string;
}

export const listVenues = async () => {
  return prisma.venue.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const createVenue = async (data: VenuePayload) => {
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
