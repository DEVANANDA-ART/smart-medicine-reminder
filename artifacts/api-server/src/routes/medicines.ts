import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  CreateMedicineBody,
  CreateReminderBody,
  CreateReminderResponse,
  CreateMedicineResponse,
  DeleteMedicineParams,
  DeleteMedicineResponse,
  GetMedicineParams,
  GetMedicineResponse,
  ListMedicinesResponse,
  ListRemindersQueryParams,
  ListRemindersResponse,
  MarkReminderSkippedParams,
  MarkReminderSkippedResponse,
  MarkReminderTakenParams,
  MarkReminderTakenResponse,
  UpdateMedicineBody,
  UpdateMedicineParams,
  UpdateMedicineResponse,
} from "@workspace/api-zod";
import {
  db,
  medicinesTable,
  remindersTable,
} from "@workspace/db";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

type ReminderRow = typeof remindersTable.$inferSelect;
type MedicineRow = typeof medicinesTable.$inferSelect;

function dateValue(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function reminderOutput(reminder: ReminderRow, medicine: MedicineRow) {
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);
  const computedStatus =
    reminder.status === "upcoming" &&
    reminder.reminderDate === today &&
    reminder.reminderTime <= nowTime
      ? "due"
      : reminder.status;
  return {
    id: reminder.id,
    medicineId: medicine.id,
    medicineName: medicine.medicineName,
    tabletImage: medicine.tabletImage,
    dosage: medicine.dosage,
    reminderTime: reminder.reminderTime,
    reminderDate: new Date(`${reminder.reminderDate}T00:00:00.000Z`),
    status: computedStatus as "upcoming" | "due" | "taken" | "skipped",
    takenAt: reminder.takenAt,
  };
}

function medicineOutput(medicine: MedicineRow) {
  return {
    id: medicine.id,
    medicineName: medicine.medicineName,
    tabletImage: medicine.tabletImage,
    dosage: medicine.dosage,
    frequency: medicine.frequency as "once_daily" | "twice_daily" | "three_daily" | "custom",
    reminderTimes: medicine.reminderTimes,
    startDate: new Date(`${medicine.startDate}T00:00:00.000Z`),
    endDate: medicine.endDate
      ? new Date(`${medicine.endDate}T00:00:00.000Z`)
      : null,
    createdAt: medicine.createdAt,
  };
}

function eachDate(start: string, end: string | null) {
  const last = end ?? start;
  const result: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const limit = new Date(`${last}T00:00:00.000Z`);
  let count = 0;
  while (cursor <= limit && count < 90) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    count += 1;
  }
  return result;
}

async function createGeneratedReminders(
  medicineId: number,
  times: string[],
  startDate: string,
  endDate: string | null,
) {
  const values = eachDate(startDate, endDate).flatMap((reminderDate) =>
    times.map((reminderTime) => ({
      medicineId,
      reminderTime,
      reminderDate,
      status: "upcoming",
    })),
  );
  if (values.length) await db.insert(remindersTable).values(values);
}

async function findOwnedMedicine(userId: number, id: number) {
  const [medicine] = await db
    .select()
    .from(medicinesTable)
    .where(and(eq(medicinesTable.id, id), eq(medicinesTable.userId, userId)))
    .limit(1);
  return medicine ?? null;
}

router.get("/medicines", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "You are not signed in." });
    return;
  }
  const medicines = await db
    .select()
    .from(medicinesTable)
    .where(eq(medicinesTable.userId, user.id))
    .orderBy(asc(medicinesTable.medicineName));
  res.json(ListMedicinesResponse.parse(medicines.map(medicineOutput)));
});

router.post("/medicines", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "You are not signed in." });
    return;
  }
  const result = CreateMedicineBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Complete the medicine name, dosage, time, and dates." });
    return;
  }
  const input = result.data;
  const startDate = dateValue(input.startDate);
  const endDate = input.endDate ? dateValue(input.endDate) : null;
  const [medicine] = await db
    .insert(medicinesTable)
    .values({
      userId: user.id,
      medicineName: input.medicineName.trim(),
      tabletImage: input.tabletImage ?? null,
      dosage: input.dosage.trim(),
      frequency: input.frequency,
      reminderTimes: input.reminderTimes,
      startDate,
      endDate,
    })
    .returning();
  if (!medicine) {
    res.status(500).json({ error: "Unable to save the medicine." });
    return;
  }
  await createGeneratedReminders(medicine.id, input.reminderTimes, startDate, endDate);
  res.status(201).json(CreateMedicineResponse.parse(medicineOutput(medicine)));
});

router.get("/medicines/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  const params = GetMedicineParams.safeParse(req.params);
  if (!user || !params.success) {
    res.status(user ? 400 : 401).json({ error: user ? "Invalid medicine id." : "You are not signed in." });
    return;
  }
  const medicine = await findOwnedMedicine(user.id, params.data.id);
  if (!medicine) {
    res.status(404).json({ error: "Medicine not found." });
    return;
  }
  res.json(GetMedicineResponse.parse(medicineOutput(medicine)));
});

router.patch("/medicines/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  const params = UpdateMedicineParams.safeParse(req.params);
  const body = UpdateMedicineBody.safeParse(req.body);
  if (!user || !params.success || !body.success) {
    res.status(!user ? 401 : 400).json({ error: !user ? "You are not signed in." : "Invalid medicine update." });
    return;
  }
  const existing = await findOwnedMedicine(user.id, params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Medicine not found." });
    return;
  }
  const input = body.data;
  const [medicine] = await db
    .update(medicinesTable)
    .set({
      ...(input.medicineName !== undefined ? { medicineName: input.medicineName.trim() } : {}),
      ...(input.tabletImage !== undefined ? { tabletImage: input.tabletImage } : {}),
      ...(input.dosage !== undefined ? { dosage: input.dosage.trim() } : {}),
      ...(input.frequency !== undefined ? { frequency: input.frequency } : {}),
      ...(input.reminderTimes !== undefined ? { reminderTimes: input.reminderTimes } : {}),
      ...(input.startDate !== undefined ? { startDate: dateValue(input.startDate) } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate ? dateValue(input.endDate) : null } : {}),
    })
    .where(eq(medicinesTable.id, existing.id))
    .returning();
  if (!medicine) {
    res.status(500).json({ error: "Unable to update the medicine." });
    return;
  }
  if (input.reminderTimes || input.startDate || input.endDate !== undefined) {
    await db.delete(remindersTable).where(eq(remindersTable.medicineId, medicine.id));
    await createGeneratedReminders(
      medicine.id,
      medicine.reminderTimes,
      medicine.startDate,
      medicine.endDate,
    );
  }
  res.json(UpdateMedicineResponse.parse(medicineOutput(medicine)));
});

router.delete("/medicines/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  const params = DeleteMedicineParams.safeParse(req.params);
  if (!user || !params.success) {
    res.status(!user ? 401 : 400).json({ error: !user ? "You are not signed in." : "Invalid medicine id." });
    return;
  }
  const existing = await findOwnedMedicine(user.id, params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Medicine not found." });
    return;
  }
  await db.delete(medicinesTable).where(eq(medicinesTable.id, existing.id));
  res.status(204).end();
});

router.get("/reminders", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "You are not signed in." });
    return;
  }
  const filterResult = ListRemindersQueryParams.safeParse(req.query);
  const filter = filterResult.success ? filterResult.data.filter : "all";
  const medicines = await db
    .select()
    .from(medicinesTable)
    .where(eq(medicinesTable.userId, user.id));
  if (!medicines.length) {
    res.json([]);
    return;
  }
  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const reminders = await db
    .select()
    .from(remindersTable)
    .where(inArray(remindersTable.medicineId, medicines.map((medicine) => medicine.id)))
    .orderBy(asc(remindersTable.reminderDate), asc(remindersTable.reminderTime));
  const today = new Date().toISOString().slice(0, 10);
  const output = reminders
    .map((reminder) => {
      const medicine = medicineMap.get(reminder.medicineId);
      return medicine ? reminderOutput(reminder, medicine) : null;
    })
    .filter((reminder): reminder is NonNullable<typeof reminder> => Boolean(reminder))
    .filter((reminder) => {
      if (filter === "today") return dateValue(reminder.reminderDate) === today;
      if (filter === "upcoming") return reminder.status === "upcoming" || reminder.status === "due";
      if (filter === "completed") return reminder.status === "taken";
      if (filter === "skipped") return reminder.status === "skipped";
      return true;
    });
  res.json(ListRemindersResponse.parse(output));
});

router.post("/reminders", async (req, res) => {
  const user = await getCurrentUser(req);
  const body = CreateReminderBody.safeParse(req.body);
  if (!user || !body.success) {
    res.status(!user ? 401 : 400).json({ error: !user ? "You are not signed in." : "Invalid reminder." });
    return;
  }
  const medicine = await findOwnedMedicine(user.id, body.data.medicineId);
  if (!medicine) {
    res.status(404).json({ error: "Medicine not found." });
    return;
  }
  const [reminder] = await db
    .insert(remindersTable)
    .values({
      medicineId: medicine.id,
      reminderTime: body.data.reminderTime,
      reminderDate: dateValue(body.data.reminderDate),
      status: "upcoming",
    })
    .returning();
  res.status(201).json(CreateReminderResponse.parse(reminderOutput(reminder, medicine)));
});

async function updateReminder(req: Request, res: Response, status: "taken" | "skipped") {
  const user = await getCurrentUser(req);
  const params = (status === "taken" ? MarkReminderTakenParams : MarkReminderSkippedParams).safeParse(req.params);
  if (!user || !params.success) {
    res.status(!user ? 401 : 400).json({ error: !user ? "You are not signed in." : "Invalid reminder id." });
    return;
  }
  const medicines = await db.select().from(medicinesTable).where(eq(medicinesTable.userId, user.id));
  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const [reminder] = await db
    .select()
    .from(remindersTable)
    .where(eq(remindersTable.id, params.data.id))
    .limit(1);
  if (!reminder || !medicineMap.has(reminder.medicineId)) {
    res.status(404).json({ error: "Reminder not found." });
    return;
  }
  const [updated] = await db
    .update(remindersTable)
    .set({ status, takenAt: status === "taken" ? new Date() : null })
    .where(eq(remindersTable.id, reminder.id))
    .returning();
  const medicine = medicineMap.get(updated.medicineId);
  if (!medicine) {
    res.status(404).json({ error: "Medicine not found." });
    return;
  }
  res.json((status === "taken" ? MarkReminderTakenResponse : MarkReminderSkippedResponse).parse(reminderOutput(updated, medicine)));
}

router.patch("/reminders/:id/taken", (req, res) => updateReminder(req, res, "taken"));
router.patch("/reminders/:id/skipped", (req, res) => updateReminder(req, res, "skipped"));
router.patch("/reminders/:id/dismiss", async (req, res) => {
  const user = await getCurrentUser(req);
  const params = MarkReminderTakenParams.safeParse(req.params);
  if (!user || !params.success) {
    res.status(!user ? 401 : 400).json({ error: !user ? "You are not signed in." : "Invalid reminder id." });
    return;
  }
  const medicines = await db.select().from(medicinesTable).where(eq(medicinesTable.userId, user.id));
  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const [reminder] = await db.select().from(remindersTable).where(eq(remindersTable.id, params.data.id)).limit(1);
  const medicine = reminder ? medicineMap.get(reminder.medicineId) : null;
  if (!reminder || !medicine) {
    res.status(404).json({ error: "Reminder not found." });
    return;
  }
  res.json(reminderOutput(reminder, medicine));
});

export default router;