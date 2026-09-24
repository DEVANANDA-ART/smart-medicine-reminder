import { createHash, randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, sessionsTable, usersTable } from "@workspace/db";

export const SESSION_COOKIE = "medicine_session";

export async function createSession(userId: number, res: Response) {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.insert(sessionsTable).values({ id, userId, expiresAt });
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

export async function destroySession(req: Request, res: Response) {
  const id = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (id) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
  }
  res.clearCookie(SESSION_COOKIE);
}

export async function getCurrentUser(req: Request) {
  const id = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!id) return null;

  const [session] = await db
    .select({ userId: sessionsTable.userId })
    .from(sessionsTable)
    .where(
      and(eq(sessionsTable.id, id), gt(sessionsTable.expiresAt, new Date())),
    )
    .limit(1);
  if (!session) return null;

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);
  return user ?? null;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hashPassword(password: string, salt: string = randomUUID()) {
  return `${salt}:${createHash("sha256").update(`${salt}:${password}`).digest("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, digest] = storedHash.split(":");
  if (!salt || !digest) return false;
  return hashPassword(password, salt).split(":")[1] === digest;
}