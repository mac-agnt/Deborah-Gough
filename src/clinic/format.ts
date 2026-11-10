/* Irish formatting helpers. All demo dates are plain ISO strings (YYYY-MM-DD)
   read as Europe/Dublin calendar dates; times are 24-hour "HH:MM" strings. */

export const SNAPSHOT = {
  date: "2026-11-10",
  time: "08:30",
  label: "Tue 10 Nov 2026, 08:30",
  tz: "Europe/Dublin",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

/** "Tue 10 Nov" */
export function dayLabel(iso: string): string {
  const p = parts(iso);
  return DAYS[p.dow] + " " + p.d + " " + MONTHS[p.m - 1];
}
/** "Tuesday 10 November" */
export function dayLong(iso: string): string {
  const p = parts(iso);
  return DAYS_LONG[p.dow] + " " + p.d + " " + MONTHS_LONG[p.m - 1];
}
/** "10/11/2026" */
export function dateShort(iso: string): string {
  const p = parts(iso);
  return String(p.d).padStart(2, "0") + "/" + String(p.m).padStart(2, "0") + "/" + p.y;
}
/** "10 Nov 2026" */
export function dateMed(iso: string): string {
  const p = parts(iso);
  return p.d + " " + MONTHS[p.m - 1] + " " + p.y;
}
export function weekday(iso: string): string {
  return DAYS[parts(iso).dow];
}
export function monthLong(m: number): string {
  return MONTHS_LONG[m - 1];
}

/** Relative day for the snapshot: Today, Tomorrow, or the day label. */
export function relDay(iso: string): string {
  if (iso === SNAPSHOT.date) return "Today";
  if (iso === addDays(SNAPSHOT.date, 1)) return "Tomorrow";
  if (iso === addDays(SNAPSHOT.date, -1)) return "Yesterday";
  return dayLabel(iso);
}

export function addDays(iso: string, n: number): string {
  const p = parts(iso);
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return t.toISOString().slice(0, 10);
}

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
export function fromMin(min: number): string {
  return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
}

const eurFmt = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurFmt2 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** "€1,240" */
export function eur(n: number): string {
  return eurFmt.format(n);
}
/** "€1,240.00" */
export function eur2(n: number): string {
  return eurFmt2.format(n);
}
export function pct(n: number, digits = 0): string {
  return n.toFixed(digits) + "%";
}
export function plural(n: number, one: string, many?: string): string {
  return n + " " + (n === 1 ? one : many || one + "s");
}
