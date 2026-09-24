import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  LoginBody,
  RegisterBody,
} from "@workspace/api-zod";
import { db, medicinesTable, remindersTable, usersTable } from "@workspace/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "../lib/session";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  const result = RegisterBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Enter a name, valid email, and password with at least 8 characters." });
    return;
  }

  const email = normalizeEmail(result.data.email);
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: result.data.name.trim(),
      email,
      passwordHash: hashPassword(result.data.password),
    })
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email });

  if (!user) {
    res.status(500).json({ error: "Unable to create the account." });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const [demoMedicine] = await db
    .insert(medicinesTable)
    .values({
      userId: user.id,
      medicineName: "Daily Wellness Demo",
      dosage: "1 tablet",
      frequency: "once_daily",
      reminderTimes: ["20:00"],
      startDate: today,
      endDate: today,
    })
    .returning({ id: medicinesTable.id });
  if (demoMedicine) {
    await db.insert(remindersTable).values({
      medicineId: demoMedicine.id,
      reminderTime: "20:00",
      reminderDate: today,
      status: "upcoming",
    });
  }

  await createSession(user.id, res);
  res.status(201).json({ user });
});

router.post("/login", async (req, res) => {
  const result = LoginBody.safeParse(req.body);
  if (!result.success) {
    res.status(401).json({ error: "Enter your email and password." });
    return;
  }

  const email = normalizeEmail(result.data.email);
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (!user || !verifyPassword(result.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  await createSession(user.id, res);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/logout", async (req, res) => {
  await destroySession(req, res);
  res.status(204).end();
});

router.get("/me", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "You are not signed in." });
    return;
  }
  res.json(user);
});

export default router;