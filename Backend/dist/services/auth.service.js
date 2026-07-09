"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = exports.verifyPassword = exports.findUserById = exports.findUserByEmail = exports.createUser = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
const createUser = async (name, email, password, role = 'SalesExecutive') => {
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    return prisma_1.default.user.create({ data: { name, email: email.toLowerCase(), passwordHash, role } });
};
exports.createUser = createUser;
const findUserByEmail = async (email) => prisma_1.default.user.findUnique({ where: { email } });
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => prisma_1.default.user.findUnique({ where: { id } });
exports.findUserById = findUserById;
const verifyPassword = async (user, password) => bcrypt_1.default.compare(password, user.passwordHash || '');
exports.verifyPassword = verifyPassword;
const generateAccessToken = (user) => jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwt_1.ACCESS_TOKEN_SECRET, { expiresIn: jwt_1.ACCESS_TOKEN_EXPIRES_IN });
exports.generateAccessToken = generateAccessToken;
