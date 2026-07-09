import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN } from '../config/jwt';

export const createUser = async (name: string, email: string, password: string, role = 'SalesExecutive') => {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { name, email: email.toLowerCase(), passwordHash, role } });
};

export const findUserByEmail = async (email: string) => prisma.user.findUnique({ where: { email } });
export const findUserById = async (id: string) => prisma.user.findUnique({ where: { id } });

export const verifyPassword = async (user: any, password: string) => bcrypt.compare(password, user.passwordHash || '');

export const generateAccessToken = (user: any) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET as any, { expiresIn: ACCESS_TOKEN_EXPIRES_IN as any } as any);
