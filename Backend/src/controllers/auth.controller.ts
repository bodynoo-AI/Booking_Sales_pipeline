import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { createUser } from '../services/auth.service';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  NODE_ENV,
} from '../config/jwt';

const createAccessToken = (payload: { id: string; email: string; role: string }) =>
  jwt.sign(payload, ACCESS_TOKEN_SECRET as any, { expiresIn: ACCESS_TOKEN_EXPIRES_IN as any } as any);

const createRefreshToken = (payload: { id: string; email: string; role: string }) =>
  jwt.sign(payload, ACCESS_TOKEN_SECRET as any, { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_SECONDS}s` } as any);

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
  });
};

const verifyToken = (token: string) => jwt.verify(token, ACCESS_TOKEN_SECRET as any) as { id: string; email: string; role: string };

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordValid = await bcrypt.compare(String(password), user.passwordHash);
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
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        remember: !!remember,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await createUser(String(name).trim(), email, password);
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
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        remember: false,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshTokenValue = createRefreshToken({ id: user.id, email: user.email, role: user.role });
    setRefreshCookie(res, refreshTokenValue);

    return res.json({ success: true, data: { accessToken } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Refresh failed' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ success: true, data: { message: 'Logged out successfully' } });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ success: true, data: { message: 'If that account exists, a reset link was sent' } });
    }

    const resetToken = jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, {
      expiresIn: `${60 * 60}s`,
    });

    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: { token: resetToken, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      create: { userId: user.id, token: resetToken, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    return res.json({ success: true, data: { message: 'If that account exists, a reset link was sent' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Forgot password failed' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await prisma.passwordReset.delete({ where: { token } });

    return res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Reset password failed' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const user = await prisma.user.findUnique({ where: { id: authReq.user?.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to fetch profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { name } = req.body;
    const user = await prisma.user.update({ where: { id: authReq.user?.id }, data: { name: String(name || '').trim() } });
    return res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to update profile' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: authReq.user?.id } });
    if (!user || !user.passwordHash) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordValid = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Change password failed' });
  }
};
