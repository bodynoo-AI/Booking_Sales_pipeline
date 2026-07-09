"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getProfile = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_service_1 = require("../services/auth.service");
const jwt_1 = require("../config/jwt");
const createAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, jwt_1.ACCESS_TOKEN_SECRET, { expiresIn: jwt_1.ACCESS_TOKEN_EXPIRES_IN });
const createRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, jwt_1.ACCESS_TOKEN_SECRET, { expiresIn: `${jwt_1.REFRESH_TOKEN_EXPIRES_IN_SECONDS}s` });
const setRefreshCookie = (res, token) => {
    res.cookie(jwt_1.REFRESH_TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: jwt_1.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: jwt_1.REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    });
};
const verifyToken = (token) => jsonwebtoken_1.default.verify(token, jwt_1.ACCESS_TOKEN_SECRET);
const login = async (req, res) => {
    try {
        const { email, password, remember } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { email: String(email).toLowerCase() } });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const passwordValid = await bcrypt_1.default.compare(String(password), user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const payload = { id: user.id, email: user.email, role: user.role };
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);
        setRefreshCookie(res, refreshToken);
        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                accessToken,
                expiresIn: jwt_1.ACCESS_TOKEN_EXPIRES_IN,
                remember: !!remember,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Login failed' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email: String(email).toLowerCase() } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        const user = await (0, auth_service_1.createUser)(String(name).trim(), email, password);
        const payload = { id: user.id, email: user.email, role: user.role };
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);
        setRefreshCookie(res, refreshToken);
        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                accessToken,
                expiresIn: jwt_1.ACCESS_TOKEN_EXPIRES_IN,
                remember: false,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Registration failed' });
    }
};
exports.register = register;
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies[jwt_1.REFRESH_TOKEN_COOKIE_NAME];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Refresh token missing' });
        }
        let payload;
        try {
            payload = verifyToken(token);
        }
        catch {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: payload.id } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
        const refreshTokenValue = createRefreshToken({ id: user.id, email: user.email, role: user.role });
        setRefreshCookie(res, refreshTokenValue);
        return res.json({ success: true, data: { accessToken } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Refresh failed' });
    }
};
exports.refreshToken = refreshToken;
const logout = async (_req, res) => {
    res.clearCookie(jwt_1.REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        secure: jwt_1.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    return res.json({ success: true, data: { message: 'Logged out successfully' } });
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email || '').toLowerCase();
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({ success: true, data: { message: 'If that account exists, a reset link was sent' } });
        }
        const resetToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, jwt_1.ACCESS_TOKEN_SECRET, {
            expiresIn: `${60 * 60}s`,
        });
        await prisma_1.default.passwordReset.upsert({
            where: { userId: user.id },
            update: { token: resetToken, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
            create: { userId: user.id, token: resetToken, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
        });
        return res.json({ success: true, data: { message: 'If that account exists, a reset link was sent' } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Forgot password failed' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and password are required' });
        }
        const reset = await prisma_1.default.passwordReset.findUnique({ where: { token } });
        if (!reset || reset.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }
        const passwordHash = await bcrypt_1.default.hash(String(password), 12);
        await prisma_1.default.user.update({ where: { id: reset.userId }, data: { passwordHash } });
        await prisma_1.default.passwordReset.delete({ where: { token } });
        return res.json({ success: true, data: { message: 'Password updated successfully' } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Reset password failed' });
    }
};
exports.resetPassword = resetPassword;
const getProfile = async (req, res) => {
    try {
        const authReq = req;
        const user = await prisma_1.default.user.findUnique({ where: { id: authReq.user?.id } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to fetch profile' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const authReq = req;
        const { name } = req.body;
        const user = await prisma_1.default.user.update({ where: { id: authReq.user?.id }, data: { name: String(name || '').trim() } });
        return res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to update profile' });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const authReq = req;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: authReq.user?.id } });
        if (!user || !user.passwordHash) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const passwordValid = await bcrypt_1.default.compare(String(currentPassword), user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        const passwordHash = await bcrypt_1.default.hash(String(newPassword), 12);
        await prisma_1.default.user.update({ where: { id: user.id }, data: { passwordHash } });
        return res.json({ success: true, data: { message: 'Password changed successfully' } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Change password failed' });
    }
};
exports.changePassword = changePassword;
