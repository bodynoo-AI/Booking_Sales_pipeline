"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTransition = exports.generateSafeRef = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateSafeRef = async (checkFn) => {
    // Use date + 6-char base36 random to keep refs compact and human-friendly
    const now = new Date();
    const datePart = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
    for (let i = 0; i < 5; i++) {
        const rand = crypto_1.default.randomBytes(4).readUInt32BE(0) % (36 ** 6);
        const randStr = rand.toString(36).toUpperCase().padStart(6, '0');
        const candidate = `EH-${datePart}-${randStr}`;
        const exists = await checkFn(candidate);
        if (!exists)
            return candidate;
    }
    // Fallback to UUID if repeated collisions occur
    return `EH-${datePart}-${crypto_1.default.randomUUID().split('-')[0].toUpperCase()}`;
};
exports.generateSafeRef = generateSafeRef;
const isValidTransition = (from, to) => {
    const allowed = {
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
exports.isValidTransition = isValidTransition;
