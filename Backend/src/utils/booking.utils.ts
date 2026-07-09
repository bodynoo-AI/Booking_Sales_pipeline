import crypto from 'crypto';

export const generateSafeRef = async (checkFn: (candidate: string) => Promise<boolean>) => {
  // Use date + 6-char base36 random to keep refs compact and human-friendly
  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  for (let i = 0; i < 5; i++) {
    const rand = crypto.randomBytes(4).readUInt32BE(0) % (36 ** 6);
    const randStr = rand.toString(36).toUpperCase().padStart(6, '0');
    const candidate = `EH-${datePart}-${randStr}`;
    const exists = await checkFn(candidate);
    if (!exists) return candidate;
  }
  // Fallback to UUID if repeated collisions occur
  return `EH-${datePart}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
};

export const isValidTransition = (from: string | undefined, to: string) => {
  const allowed: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'ON_HOLD', 'CANCELLED'],
    ON_HOLD: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };
  const fromKey = (from || 'PENDING').toUpperCase();
  const toKey = to.toUpperCase();
  const allowedTargets = allowed[fromKey] ?? [];
  return allowedTargets.includes(toKey);
};
