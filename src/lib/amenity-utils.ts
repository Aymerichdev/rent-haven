import type { AmenitySchedule, WeekDay, AmenityBooking } from "./types";

export const WEEK_DAYS: { key: WeekDay; label: string }[] = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mié" },
  { key: "thu", label: "Jue" },
  { key: "fri", label: "Vie" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
];

const JS_TO_KEY: WeekDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const dateToWeekDay = (isoDate: string): WeekDay => {
  // Build date in local TZ from YYYY-MM-DD
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return JS_TO_KEY[dt.getDay()];
};

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const fromMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const buildSlots = (
  schedule: AmenitySchedule,
): { startTime: string; endTime: string }[] => {
  const start = toMinutes(schedule.openTime);
  const end = toMinutes(schedule.closeTime);
  const dur = schedule.slotDurationMinutes;
  if (!dur || end <= start) return [];
  const slots: { startTime: string; endTime: string }[] = [];
  for (let t = start; t + dur <= end; t += dur) {
    slots.push({ startTime: fromMinutes(t), endTime: fromMinutes(t + dur) });
  }
  return slots;
};

export const scheduleSummary = (s?: AmenitySchedule): string => {
  if (!s || s.days.length === 0) return "Sin horario definido";
  const order: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const sorted = order.filter((d) => s.days.includes(d));
  // Detect contiguous range
  let label = sorted.map((d) => WEEK_DAYS.find((w) => w.key === d)!.label).join(", ");
  const idxs = sorted.map((d) => order.indexOf(d));
  const contiguous = idxs.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);
  if (contiguous && sorted.length > 2) {
    label = `${WEEK_DAYS.find((w) => w.key === sorted[0])!.label}–${
      WEEK_DAYS.find((w) => w.key === sorted[sorted.length - 1])!.label
    }`;
  }
  return `${label} · ${s.openTime}–${s.closeTime} · turnos de ${s.slotDurationMinutes} min`;
};

export const isSlotTaken = (
  bookings: AmenityBooking[],
  amenityId: string,
  date: string,
  startTime: string,
): boolean =>
  bookings.some(
    (b) =>
      b.amenityId === amenityId &&
      b.date === date &&
      b.status === "approved" &&
      (b.startTime ?? b.time) === startTime,
  );
