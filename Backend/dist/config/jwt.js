"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_ENV = exports.RESET_TOKEN_EXPIRES_MINUTES = exports.REFRESH_TOKEN_EXPIRES_IN_SECONDS = exports.REFRESH_TOKEN_COOKIE_NAME = exports.ACCESS_TOKEN_EXPIRES_IN = exports.ACCESS_TOKEN_SECRET = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'eventhub360-access-secret';
exports.ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
exports.REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'eventhub360_refresh_token';
exports.REFRESH_TOKEN_EXPIRES_IN_SECONDS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS || '604800');
exports.RESET_TOKEN_EXPIRES_MINUTES = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || '60');
exports.NODE_ENV = process.env.NODE_ENV || 'development';
