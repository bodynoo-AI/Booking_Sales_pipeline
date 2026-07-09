import dotenv from 'dotenv';

dotenv.config();

export const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'eventhub360-access-secret';
export const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
export const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'eventhub360_refresh_token';
export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS || '604800');
export const RESET_TOKEN_EXPIRES_MINUTES = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || '60');
export const NODE_ENV = process.env.NODE_ENV || 'development';
