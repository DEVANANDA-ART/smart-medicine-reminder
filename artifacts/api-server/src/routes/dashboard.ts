import { Router, type IRouter } from "express";
import { asc, eq, inArray } from "drizzle-orm";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { db, medicinesTable, remindersTable } from "@workspace/db";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

function output(reminder: typeof remindersTable.$inferSelect, medicine: typeof medicinesTable.$inferSelect) {
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);
  return {
    id: reminder.id,
    medicineId: medicine.id,
    medicineName: medicine.medicineName,
    tabletImage: medicine.tabletImage,
    dosage: medicine.dosage,
    reminderTime: reminder.reminderTime,
    reminderDate: new Date(`${reminder.reminderDate}T00:00:00.000Z`),
    status: reminder.status === "upcoming" && reminder.reminderDate === today && reminder.reminderTime <= nowTime
      ? "due"
      : reminder.status as "upcoming" | "due" | "taken" | "skipped",
    takenAt: reminder.takenAt,
  };
}

router.get("/dashboard/summary", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "You are not signed in." });
    return;
  }
  const medicines = await db.select().from(medicinesTable).where(eq(medicinesTable.userId, user.id));
  const today = new Date().toISOString().slice(0, 10);
  if (!medicines.length) {
    res.json({ today: [], nextReminder: null, takenCount: 0, totalCount: 0, adherencePercent: 0 });
    return;
  }
  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const rows = await db
    .select()
    .from(remindersTable)
    .where(inArray(remindersTable.medicineId, medicines.map((medicine) => medicine.id)))
    .orderBy(asc(remindersTable.reminderDate), asc(remindersTable.reminderTime));
  const todayRows = rows
    .filter((row) => row.reminderDate === today)
    .map((row) => {
      const medicine = medicineMap.get(row.medicineId);
      return medicine ? output(row, medicine) : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const candidates = rows
    .filter((row) => row.status === "upcoming" && row.reminderDate >= today)
    .map((row) => {
      const medicine = medicineMap.get(row.medicineId);
      return medicine ? output(row, medicine) : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const takenCount = todayRows.filter((row) => row.status === "taken").length;
  const totalCount = todayRows.length;
  res.json(GetDashboardSummaryResponse.parse({
    today: todayRows,
    nextReminder: candidates[0] ?? null,
    takenCount,
    totalCount,
    adherencePercent: totalCount ? Math.round((takenCount / totalCount) * 100) : 0,
  }));
});

export default router;