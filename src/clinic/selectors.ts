/* Derived figures. Every number a page shows should come from here so that
   Home, Bookings, Finance, Dashboard and Activity always agree. */

import * as F from "./fixtures";
import { SNAPSHOT, toMin } from "./format";
import type { ClinicState, ConvRow } from "./store";
import { isOpen, slotsOn } from "./store";

export const live = (a: F.Appointment) => a.status !== "Cancelled";

export function apptBySlot(s: ClinicState): Record<string, F.Appointment> {
  const m: Record<string, F.Appointment> = {};
  for (const a of s.appointments) if (live(a)) m[a.slotId] = a;
  return m;
}
export const slotOf = (a: F.Appointment) => F.SLOT_BY_ID[a.slotId];
export const patientOf = (s: ClinicState, id: string) => s.patients.find((p) => p.id === id)!;
export const serviceOf = (a: F.Appointment) => F.SERVICE_BY_ID[a.serviceId];

export function apptsOn(s: ClinicState, dates: string[]): F.Appointment[] {
  return s.appointments.filter((a) => live(a) && dates.includes(slotOf(a).date))
    .sort((x, y) => (slotOf(x).date + slotOf(x).start).localeCompare(slotOf(y).date + slotOf(y).start));
}
/** Open slots on the given dates that are still in the future relative to the snapshot. */
export function openSlots(s: ClinicState, dates: string[]): F.Slot[] {
  return dates.flatMap((d) => slotsOn(d)).filter((sl) => isOpen(s, sl.id))
    .filter((sl) => sl.date > SNAPSHOT.date || (sl.date === SNAPSHOT.date && toMin(sl.start) >= toMin(SNAPSHOT.time)));
}

export interface Capacity { capacity: number; booked: number; open: number; utilisation: number; newPatients: number; returning: number }
export function capacityFor(s: ClinicState, dates: string[]): Capacity {
  const capacity = dates.reduce((n, d) => n + slotsOn(d).length, 0);
  const appts = apptsOn(s, dates);
  const booked = appts.length;
  const newPatients = appts.filter((a) => a.isNew).length;
  return { capacity, booked, open: capacity - booked, utilisation: capacity ? Math.round((booked / capacity) * 100) : 0, newPatients, returning: booked - newPatients };
}
export const week = (s: ClinicState) => capacityFor(s, F.THIS_WEEK);
export const today = (s: ClinicState) => capacityFor(s, [SNAPSHOT.date]);

/* Patients */
export function patientAppts(s: ClinicState, patientId: string): F.Appointment[] {
  return s.appointments.filter((a) => a.patientId === patientId)
    .sort((x, y) => (slotOf(x).date + slotOf(x).start).localeCompare(slotOf(y).date + slotOf(y).start));
}
export function nextAppt(s: ClinicState, patientId: string): F.Appointment | undefined {
  return patientAppts(s, patientId).find((a) => live(a) && (a.status === "Booked" || a.status === "Confirmed"));
}
export function lastVisit(s: ClinicState, patientId: string): F.Appointment | undefined {
  return patientAppts(s, patientId).filter((a) => a.status === "Attended").pop();
}
export function balanceStatus(s: ClinicState, patientId: string): "Clear" | "Payment to match" {
  return s.transactions.some((t) => !t.matched && t.proposedPatientId === patientId) ? "Payment to match" : "Clear";
}

/* Preparation */
export interface PrepRow extends F.PrepCheck { resolved: boolean; appointment?: F.Appointment; patient: F.Patient }
export function prepRows(s: ClinicState): PrepRow[] {
  return F.PREP_CHECKS.map((p) => ({
    ...p, resolved: !!s.prepResolved[p.id], patient: patientOf(s, p.patientId),
    appointment: s.appointments.find((a) => live(a) && a.patientId === p.patientId && slotOf(a).date === p.date),
  }));
}
export const prepOutstanding = (s: ClinicState) => prepRows(s).filter((p) => !p.resolved);

/* Inbox */
export function inboxCounts(s: ClinicState) {
  const open = s.conversations.filter((c) => c.state === "Open");
  const drafts = open.filter((c) => c.category === "Draft ready" && c.draftState === "Ready");
  const personal = open.filter((c) => c.category === "Personal review");
  const awaiting = open.filter((c) => c.category === "Awaiting information");
  return { open: open.length, drafts: drafts.length, personal: personal.length, awaiting: awaiting.length, sent: s.conversations.filter((c) => c.state === "Sent in demo").length };
}
export const openDrafts = (s: ClinicState): ConvRow[] => s.conversations.filter((c) => c.state === "Open" && c.category === "Draft ready" && c.draftState === "Ready");

/* Finance */
export function unmatchedReceipts(s: ClinicState): F.Transaction[] {
  return s.transactions.filter((t) => t.kind === "Receipt" && !t.matched);
}
export function receiptQueue(s: ClinicState) {
  const list = unmatchedReceipts(s);
  return { count: list.length, total: list.reduce((n, t) => n + t.amount, 0), list };
}
export function monthOf(s: ClinicState, ym: string) {
  const rows = s.transactions.filter((t) => t.date.startsWith(ym));
  // Received funds count once, when received. Allocating (matching) a receipt
  // never changes revenue or cash; it only records who paid.
  const revenueRows = rows.filter((t) => t.kind === "Receipt");
  const costRows = rows.filter((t) => t.kind === "Expense");
  const revenueByArea: Record<F.RevenueArea, number> = { Consultations: 0, Skin: 0, "Hair & scalp": 0 };
  let unallocated = 0;
  for (const t of revenueRows) { if (t.area) revenueByArea[t.area] += t.amount; else unallocated += t.amount; }
  const costByCat: Record<F.CostCategory, number> = { "Room rental": 0, Consumables: 0, Insurance: 0, "Software and communications": 0, "Other business expenses": 0 };
  for (const t of costRows) if (t.category) costByCat[t.category] += t.amount;
  const revenue = revenueRows.reduce((n, t) => n + t.amount, 0);
  const costs = costRows.reduce((n, t) => n + t.amount, 0);
  const received = rows.filter((t) => t.kind === "Receipt").reduce((n, t) => n + t.amount, 0);
  const missingDocs = costRows.filter((t) => !t.docOnFile);
  return { rows, revenueRows, costRows, revenueByArea, unallocated, costByCat, revenue, costs, surplus: revenue - costs, received, missingDocs };
}
export const october = (s: ClinicState) => monthOf(s, "2026-10");

/* Marketing */
export function localShare(s: ClinicState) {
  const appts = apptsOn(s, F.THIS_WEEK).filter((a) => a.isNew);
  const pats = appts.map((a) => patientOf(s, a.patientId));
  const local = pats.filter((p) => p.targetArea);
  const by: Record<string, number> = {};
  for (const p of local) by[p.locality] = (by[p.locality] || 0) + 1;
  const elsewhere: Record<string, number> = {};
  for (const p of pats.filter((x) => !x.targetArea)) elsewhere[p.locality] = (elsewhere[p.locality] || 0) + 1;
  return {
    newPatients: pats.length, local: local.length, pct: pats.length ? Math.round((local.length / pats.length) * 100) : 0,
    byLocality: F.TARGET_AREAS.map((a) => ({ area: a, count: by[a] || 0 })),
    elsewhere: Object.entries(elsewhere).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count),
    elsewhereTotal: pats.length - local.length,
  };
}
export const postsAwaiting = (s: ClinicState) => s.posts.filter((p) => p.status === "Awaiting approval");
export function funnel(s: ClinicState) {
  const w = week(s);
  return [
    { stage: "Enquiries", value: F.FUNNEL_EVENTS.enquiries },
    { stage: "Booking-link opens", value: F.FUNNEL_EVENTS.bookingLinkOpens },
    { stage: "New-patient bookings", value: w.newPatients },
  ];
}

/* Work */
export function onboardingStats(s: ClinicState) {
  const done = F.ONBOARDING.filter((o) => s.onboarding[o.id]).length;
  return { done, total: F.ONBOARDING.length, pct: Math.round((done / F.ONBOARDING.length) * 100) };
}
/** Task status: an explicit change wins, otherwise linked story items close the task. */
export function taskRows(s: ClinicState): F.Task[] {
  const derived = (t: F.Task): F.TaskStatus => {
    if (s.taskStatus[t.id]) return s.taskStatus[t.id];
    if (t.linkedTo?.startsWith("CONV-")) {
      const c = s.conversations.find((x) => x.id === t.linkedTo);
      if (c && c.state !== "Open") return "Done";
    }
    if (t.linkedTo?.startsWith("PREP-") && s.prepResolved[t.linkedTo]) return "Done";
    if (t.id === "TSK-06" && receiptQueue(s).count === 0) return "Done";
    if (t.id === "TSK-08" && postsAwaiting(s).length === 0) return "Done";
    if (t.id === "TSK-09") {
      const c = s.conversations.find((x) => x.id === "CONV-09");
      if (c && c.state !== "Open") return "Done";
    }
    return t.status;
  };
  return [...s.addedTasks, ...F.TASKS].map((t) => ({ ...t, status: derived(t) }));
}
export const openTasks = (s: ClinicState) => taskRows(s).filter((t) => t.status !== "Done");

export interface Approval { id: string; type: "Message draft" | "Content post" | "Payment match" | "Availability offer"; title: string; detail: string; link: { page: string; tab: string; id?: string } }
export function approvals(s: ClinicState): Approval[] {
  const out: Approval[] = [];
  for (const c of openDrafts(s)) out.push({ id: c.id, type: c.id === "CONV-01" ? "Availability offer" : "Message draft", title: c.contactName + " · " + c.purpose, detail: c.draft || "", link: { page: "Inbox", tab: "drafts", id: c.id } });
  for (const p of postsAwaiting(s)) out.push({ id: p.id, type: "Content post", title: p.title, detail: p.caption, link: { page: "Marketing", tab: "library", id: p.id } });
  for (const t of unmatchedReceipts(s).filter((x) => x.proposedPatientId)) out.push({ id: t.id, type: "Payment match", title: "€" + t.amount + " → " + patientOf(s, t.proposedPatientId!).name, detail: t.proposedConfidence || "", link: { page: "Finance", tab: "transactions", id: t.id } });
  for (const w of s.waitlist.filter((x) => x.status === "Offer drafted" && !x.conversationId)) out.push({ id: w.id, type: "Availability offer", title: patientOf(s, w.patientId).name + " · " + F.SLOT_BY_ID[w.matchSlot!].start, detail: "Offer drafted by the Booking Agent", link: { page: "Bookings", tab: "waitlist" } });
  return out;
}

/* Agents */
export function runApproval(s: ClinicState, run: F.AgentRun): F.RunApproval {
  if (s.runDecisions[run.id]) return s.runDecisions[run.id];
  if (run.follows?.startsWith("CONV-")) {
    const c = s.conversations.find((x) => x.id === run.follows);
    if (c && c.state === "Sent in demo") return "Approved";
    if (c && c.draftState === "Rejected") return "Rejected";
  }
  if (run.follows?.startsWith("TX-")) {
    const t = s.transactions.find((x) => x.id === run.follows);
    if (t?.matched) return "Approved";
  }
  if (run.id === "RUN-04" && inboxCounts(s).drafts === 0) return "Approved";
  if (run.id === "RUN-07" && postsAwaiting(s).length === 0) return "Approved";
  return run.approval;
}

/* Activity: seed plus this session's events, newest first. */
export function activity(s: ClinicState): F.ActivityEvent[] {
  return [...s.events, ...F.ACTIVITY_SEED].sort((a, b) => b.at.localeCompare(a.at));
}

/* Plain-language briefing, used by Home and the Briefing agent. */
export function briefing(s: ClinicState): string {
  const t = today(s), q = receiptQueue(s), ib = inboxCounts(s), prep = prepOutstanding(s).length;
  const wl = s.waitlist.filter((w) => w.status !== "Booked").length;
  const slots = t.open === 1 ? "one available slot" : (t.open === 2 ? "two available slots" : t.open + " available slots");
  const parts = [
    "Morning Deborah. You have " + t.booked + " appointments today and " + slots + ", with " + numWord(wl) + " patient" + (wl === 1 ? "" : "s") + " on the waitlist.",
    q.count ? (numWord(q.count, true) + " received payment" + (q.count === 1 ? "" : "s") + " totalling €" + q.total.toLocaleString("en-IE") + " still need" + (q.count === 1 ? "s" : "") + " matching.") : "Every received payment is matched.",
    ib.drafts ? ("I've prepared " + numWord(ib.drafts) + " message draft" + (ib.drafts === 1 ? "" : "s") + "; " + numWord(ib.personal) + " other conversation" + (ib.personal === 1 ? " needs" : "s need") + " your personal review.") : (ib.personal ? numWord(ib.personal, true) + " conversation" + (ib.personal === 1 ? " needs" : "s need") + " your personal review." : "The inbox is clear."),
    prep ? (numWord(prep, true) + " upcoming appointment" + (prep === 1 ? " also needs a preparation check." : "s also need preparation checks.")) : "All upcoming appointments are prepared.",
  ];
  return parts.join(" ");
}
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export function numWord(n: number, cap = false): string {
  const w = n < WORDS.length ? WORDS[n] : String(n);
  return cap ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

/* Follow-up reminders: administrative only. Each treatment attended last week
   gets a review reminder; Deborah decides whether it goes out. */
export interface FollowUp { id: string; patientId: string; appointmentId: string; service: string; attended: string; due: string; status: "Scheduled" | "Reviewed" | "Skipped"; reason: string }
export function followUps(s: ClinicState): FollowUp[] {
  const out: FollowUp[] = [];
  for (const a of s.appointments) {
    const sl = slotOf(a);
    if (a.status !== "Attended" || !F.LAST_WEEK.includes(sl.date)) continue;
    if (a.serviceId !== "micro" && a.serviceId !== "hair" && a.serviceId !== "skin") continue;
    const id = "FU-" + a.id.slice(4);
    const days = a.serviceId === "micro" ? 28 : a.serviceId === "hair" ? 42 : 21;
    const [y, m, d] = sl.date.split("-").map(Number);
    const due = new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
    out.push({ id, patientId: a.patientId, appointmentId: a.id, service: F.SERVICE_BY_ID[a.serviceId].name, attended: sl.date, due,
      status: s.followups[id] || "Scheduled", reason: "Admin reminder to offer a follow-up review " + days + " days after the visit" });
  }
  return out.sort((x, y) => x.due.localeCompare(y.due));
}
