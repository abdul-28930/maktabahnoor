import crypto from 'crypto';
import redis from './redis.js';

const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export function hashPassword(password, salt = null) {
  const userSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, userSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: userSalt };
}

export function verifyPassword(password, storedHash, salt) {
  if (!password || !storedHash || !salt) return false;
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, storedBuf);
  } catch {
    return false;
  }
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(`mn_user_session:${token}`, userId, { ex: SESSION_TTL });
  return token;
}

export async function getUserFromSessionToken(token) {
  if (!token) return null;
  try {
    const userId = await redis.get(`mn_user_session:${token}`);
    if (!userId) return null;
    const user = await redis.get(`mn_user:${userId}`);
    return user || null;
  } catch (e) {
    return null;
  }
}

export async function deleteSession(token) {
  if (!token) return;
  try {
    await redis.del(`mn_user_session:${token}`);
  } catch (e) {}
}
