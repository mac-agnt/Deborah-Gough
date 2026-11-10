/* Clinic demo state. One store, local only: nothing here talks to a server,
   sends a message, moves money or publishes a post. Actions update the
   fictional records and append an activity event so every counter that
   derives from those records moves together.

   Persistence: namespaced localStorage key, wrapped in try/catch so the demo
   still works in a private window. `reset()` restores the fixtures. */

import { useSyncExternalStore } from "react";
import * as F from "./fixtures";
import { SNAPSHOT, dayLabel, toMin, fromMin } from "./format";

const KEY = "pulse.deborah-gough.demo.v1";

export type ConvState = "Open" | "Sent in demo" | "Closed";
export interface ConvRow extends F.Conversation {
  state: ConvState;
  draftState?: "Ready" | "Rejected" | "Sent in demo";
  variant: number;
  sentText?: string;
}
export interface Settings {
  notifyDrafts: boolean;
  notifyPayments: boolean;
  notifyPrep: boolean;
  dailyBriefing: boolean;
  draftFirst: boolean;
  escalateSensitive: boolean;
  allowFinanceData: boolean;
  allowMarketingUsePatientData: boolean;
  quietHours: boolean;
  timezone: string;
}
export interface ClinicState {
  v: 1;
  patients: F.Patient[];
  appointments: F.Appointment[];
  waitlist: F.WaitlistEntry[];
  conversations: ConvRow[];
  posts: F.Post[];
  transactions: F.Transaction[];
  prepResolved: Record<string, boolean>;
  taskStatus: Record<string, F.TaskStatus>;
  addedTasks: F.Task[];
  onboarding: Record<string, boolean>;
  /** Follow-up reminder review status, keyed by follow-up id (see selectors.followUps). */
  followups: Record<string, "Scheduled" | "Reviewed" | "Skipped">;
  agentsPaused: Record<string, boolean>;
  runDecisions: Record<string, F.RunApproval>;
  settings: Settings;
  /** Events created in this demo session, newest first. */
  events: F.ActivityEvent[];
  seq: number;
}

function fresh(): ClinicState {
  const c = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  return {
    v: 1,
    patients: c(F.PATIENTS),
    appointments: c(F.APPOINTMENTS),
    waitlist: c(F.WAITLIST),
    conversations: c(F.CONVERSATIONS).map((cv) => ({ ...cv, state: "Open" as ConvState, draftState: cv.draft ? "Ready" : undefined, variant: 0 })),
    posts: c(F.POSTS),
    transactions: c(F.TRANSACTIONS),
    prepResolved: {},
    taskStatus: {},
    addedTasks: [],
    onboarding: Object.fromEntries(F.ONBOARDING.map((o) => [o.id, o.done])),
    followups: {},
    agentsPaused: {},
    runDecisions: {},
    settings: {
      notifyDrafts: true, notifyPayments: true, notifyPrep: true, dailyBriefing: true,
      draftFirst: true, escalateSensitive: true, allowFinanceData: true, allowMarketingUsePatientData: false,
      quietHours: true, timezone: "Europe/Dublin",
    },
    events: [],
    seq: 0,
  };
}

function load(): ClinicState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1) return { ...fresh(), ...parsed };
    }
  } catch { /* storage unavailable: start from fixtures */ }
  return fresh();
}

let state: ClinicState = typeof window === "undefined" ? fresh() : load();
const listeners = new Set<() => void>();

function commit(next: ClinicState) {
  state = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function getState(): ClinicState { return state; }
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
/** React hook: re-renders on every store change. */
export function useClinic(): ClinicState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ── navigation bridge (set by PulseLogic) ──────────────────────────────── */
type Nav = (page: string, tab?: string, focusId?: string) => void;
let navigator: Nav = () => {};
export function setNavigator(fn: Nav) { navigator = fn; }
/** Move to a module page and tab. `focusId` opens a record where the page supports it. */
export function go(page: string, tab?: string, focusId?: string) { navigator(page, tab, focusId); }

/* ── transient UI (not persisted) ───────────────────────────────────────── */
interface UiState { patientDrawer: string | null; focus: Record<string, string | undefined>; toast: string | null; toastSeq: number }
let ui: UiState = { patientDrawer: null, focus: {}, toast: null, toastSeq: 0 };
const uiListeners = new Set<() => void>();
const uiCommit = (n: UiState) => { ui = n; uiListeners.forEach((l) => l()); };
export function useUi(): UiState {
  return useSyncExternalStore((f) => { uiListeners.add(f); return () => { uiListeners.delete(f); }; }, () => ui, () => ui);
}
export function openPatient(id: string | null) { uiCommit({ ...ui, patientDrawer: id }); }
/** A record a page should open on arrival, keyed by page name. Read once with takeFocus. */
export function setFocus(page: string, id: string | undefined) { uiCommit({ ...ui, focus: { ...ui.focus, [page]: id } }); }
export function takeFocus(page: string): string | undefined {
  const id = ui.focus[page];
  if (id) ui = { ...ui, focus: { ...ui.focus, [page]: undefined } };
  return id;
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
/** Short confirmation line. Always says "in demo" when something would have left Pulse. */
export function toast(msg: string) {
  clearTimeout(toastTimer);
  uiCommit({ ...ui, toast: msg, toastSeq: ui.toastSeq + 1 });
  toastTimer = setTimeout(() => uiCommit({ ...ui, toast: null }), 3600);
}

/* ── helpers ────────────────────────────────────────────────────────────── */
function stamp(s: ClinicState) {
  // Demo clock: events created now are stamped a minute apart after the snapshot.
  const min = toMin(SNAPSHOT.time) + 1 + s.seq;
  return SNAPSHOT.date + " " + fromMin(Math.min(min, 23 * 60 + 59));
}
function withEvent(s: ClinicState, e: Omit<F.ActivityEvent, "id" | "at">): ClinicState {
  const seq = s.seq + 1;
  const ev: F.ActivityEvent = { id: "EVT-" + String(seq).padStart(3, "0"), at: stamp(s), ...e };
  return { ...s, seq, events: [ev, ...s.events] };
}
export type Result = { ok: true; id?: string } | { ok: false; error: string };

export function slotsOn(date: string): F.Slot[] {
  return F.SLOTS.filter((x) => x.date === date).sort((a, b) => toMin(a.start) - toMin(b.start));
}
/** Latest end time a service starting in this slot may run to (next slot, break or close). */
function limitFor(slot: F.Slot): number {
  const day = slotsOn(slot.date);
  const i = day.findIndex((x) => x.id === slot.id);
  const next = day[i + 1];
  let limit = next ? toMin(next.start) : toMin(F.HOURS.close);
  for (const b of F.HOURS.breaks) if (toMin(b.start) >= toMin(slot.start)) limit = Math.min(limit, toMin(b.start));
  return limit;
}
/** Can this service be placed in this slot? Checks duration, turnover, breaks and hours. */
export function fits(slot: F.Slot, serviceId: F.ServiceId): { ok: boolean; reason?: string } {
  const sv = F.SERVICE_BY_ID[serviceId];
  const start = toMin(slot.start);
  if (start < toMin(F.HOURS.open)) return { ok: false, reason: "Before opening time" };
  if (sv.duration > slot.length) return { ok: false, reason: sv.name + " takes " + sv.duration + " min; this slot is " + slot.length + " min" };
  const end = start + sv.duration + sv.turnover;
  if (end > limitFor(slot)) return { ok: false, reason: "No room for the " + sv.turnover + " min turnover before the next appointment or break" };
  if (start + sv.duration > toMin(F.HOURS.close)) return { ok: false, reason: "Runs past closing time" };
  return { ok: true };
}
export function isOpen(s: ClinicState, slotId: string): boolean {
  return !s.appointments.some((a) => a.slotId === slotId && a.status !== "Cancelled");
}

/* ── actions ────────────────────────────────────────────────────────────── */
function setP(fn: (s: ClinicState) => ClinicState | Result | void) {
  const out = fn(state);
  if (out && "v" in (out as ClinicState)) commit(out as ClinicState);
}

export interface NewPatientInput { first: string; last: string; locality: string; contactPref: F.ContactPref }

export function bookAppointment(input: {
  slotId: string; serviceId: F.ServiceId; patientId?: string; newPatient?: NewPatientInput;
  via: F.Appointment["bookedVia"]; waitlistId?: string;
}): Result {
  let s = state;
  const slot = F.SLOT_BY_ID[input.slotId];
  if (!slot) return { ok: false, error: "That slot does not exist." };
  if (!isOpen(s, slot.id)) return { ok: false, error: "That slot was just taken. Pick another time." };
  if (slot.date < SNAPSHOT.date || (slot.date === SNAPSHOT.date && toMin(slot.start) < toMin(SNAPSHOT.time))) return { ok: false, error: "That time has passed." };
  const f = fits(slot, input.serviceId);
  if (!f.ok) return { ok: false, error: f.reason || "Does not fit this slot." };

  let patientId = input.patientId;
  let isNew = false;
  if (!patientId) {
    const np = input.newPatient;
    if (!np || !np.first.trim() || !np.last.trim()) return { ok: false, error: "Add the patient's first and last name." };
    const n = s.patients.length + 1;
    patientId = "PAT-" + String(n).padStart(3, "0");
    const first = np.first.trim(), last = np.last.trim();
    const slug = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
    const p: F.Patient = {
      id: patientId, first, last, name: first + " " + last, locality: np.locality, targetArea: F.TARGET_AREAS.includes(np.locality),
      source: input.via === "Online booking (demo)" ? "Website" : "Instagram", contactPref: np.contactPref,
      email: slug(first) + "." + slug(last) + "@patient.example", phoneMasked: "08" + (n % 5 + 5) + " ••• •" + String(100 + (n * 37) % 900),
      registered: SNAPSHOT.date, intake: "Not started", consentDocs: "Not required yet", notes: "Created in the demo.",
    };
    s = { ...s, patients: [...s.patients, p] };
    isNew = true;
  } else {
    isNew = !s.appointments.some((a) => a.patientId === patientId && a.status === "Attended");
  }
  const seq = s.appointments.filter((a) => a.id.startsWith("APT-D")).length + 1;
  const appt: F.Appointment = { id: "APT-D" + String(seq).padStart(3, "0"), slotId: slot.id, patientId, serviceId: input.serviceId,
    status: "Booked", isNew, bookedVia: input.via };
  s = { ...s, appointments: [...s.appointments, appt] };
  if (input.waitlistId) s = { ...s, waitlist: s.waitlist.map((w) => (w.id === input.waitlistId ? { ...w, status: "Booked" as F.OfferStatus, matchSlot: slot.id } : w)) };
  else s = { ...s, waitlist: s.waitlist.map((w) => (w.patientId === patientId && w.status !== "Booked" ? { ...w, status: "Booked" as F.OfferStatus, matchSlot: slot.id } : w)) };
  const name = s.patients.find((p) => p.id === patientId)!.name;
  s = withEvent(s, { kind: "Your action", actor: "Deborah", area: "Bookings",
    text: name + " booked for " + F.SERVICE_BY_ID[input.serviceId].name.toLowerCase() + ", " + dayLabel(slot.date) + " " + slot.start + " (" + slot.id + ")" + (input.via === "Online booking (demo)" ? " via the online booking preview" : "") + ".",
    link: { page: "Bookings", tab: "calendar", id: appt.id } });
  commit(s);
  return { ok: true, id: appt.id };
}

export function rescheduleAppointment(apptId: string, slotId: string): Result {
  let s = state;
  const appt = s.appointments.find((a) => a.id === apptId);
  const slot = F.SLOT_BY_ID[slotId];
  if (!appt || !slot) return { ok: false, error: "Appointment or slot not found." };
  if (appt.slotId === slotId) return { ok: false, error: "That is the current time." };
  if (!isOpen(s, slotId)) return { ok: false, error: "That slot is already booked. No double booking." };
  if (slot.date < SNAPSHOT.date || (slot.date === SNAPSHOT.date && toMin(slot.start) < toMin(SNAPSHOT.time))) return { ok: false, error: "That time has passed." };
  const f = fits(slot, appt.serviceId);
  if (!f.ok) return { ok: false, error: f.reason || "Does not fit." };
  const from = F.SLOT_BY_ID[appt.slotId];
  s = { ...s, appointments: s.appointments.map((a) => (a.id === apptId ? { ...a, slotId } : a)) };
  const name = s.patients.find((p) => p.id === appt.patientId)!.name;
  s = withEvent(s, { kind: "Your action", actor: "Deborah", area: "Bookings",
    text: name + " moved from " + dayLabel(from.date) + " " + from.start + " to " + dayLabel(slot.date) + " " + slot.start + ".",
    link: { page: "Bookings", tab: "calendar", id: apptId } });
  commit(s);
  return { ok: true, id: apptId };
}

/** Booking Agent drafts an offer for a waitlist entry. Nothing is sent. */
export function draftOffer(waitlistId: string, slotId: string): Result {
  const w = state.waitlist.find((x) => x.id === waitlistId);
  const slot = F.SLOT_BY_ID[slotId];
  if (!w || !slot) return { ok: false, error: "Not found." };
  if (!isOpen(state, slotId)) return { ok: false, error: "Slot no longer open." };
  const f = fits(slot, w.serviceId);
  if (!f.ok) return { ok: false, error: f.reason || "Does not fit." };
  let s: ClinicState = { ...state, waitlist: state.waitlist.map((x) => (x.id === waitlistId ? { ...x, status: "Offer drafted" as F.OfferStatus, matchSlot: slotId } : x)) };
  const p = s.patients.find((x) => x.id === w.patientId)!;
  s = withEvent(s, { kind: "Agent proposal", actor: "Booking Agent", area: "Bookings", text: "Offer drafted for " + p.name + ": " + dayLabel(slot.date) + " " + slot.start + ". Waiting for approval.", link: { page: "Bookings", tab: "waitlist" } });
  commit(s);
  return { ok: true };
}

/** Approve the offer: it is marked "Sent in demo". No message leaves Pulse. */
export function approveOffer(waitlistId: string): Result {
  const w = state.waitlist.find((x) => x.id === waitlistId);
  if (!w || !w.matchSlot) return { ok: false, error: "No offer to approve." };
  if (w.conversationId) { approveDraft(w.conversationId); return { ok: true }; }
  let s: ClinicState = { ...state, waitlist: state.waitlist.map((x) => (x.id === waitlistId ? { ...x, status: "Sent in demo" as F.OfferStatus } : x)) };
  const p = s.patients.find((x) => x.id === w.patientId)!;
  s = withEvent(s, { kind: "Your action", actor: "Deborah", area: "Bookings", text: "Deborah approved the availability offer to " + p.name + ". Marked sent in demo.", link: { page: "Bookings", tab: "waitlist" } });
  commit(s);
  return { ok: true };
}

/** The patient says yes (simulated): books the matched slot and clears the waitlist entry. */
export function confirmWaitlistBooking(waitlistId: string): Result {
  const w = state.waitlist.find((x) => x.id === waitlistId);
  if (!w || !w.matchSlot) return { ok: false, error: "No offer to confirm." };
  const pat = state.patients.find((p) => p.id === w.patientId)!;
  const via = pat.contactPref === "Email" ? "Phone" : (pat.contactPref as F.Appointment["bookedVia"]);
  return bookAppointment({ slotId: w.matchSlot, serviceId: w.serviceId, patientId: w.patientId, via, waitlistId });
}
export function declineOffer(waitlistId: string) {
  setP((s) => withEvent({ ...s, waitlist: s.waitlist.map((x) => (x.id === waitlistId ? { ...x, status: "Not offered" as F.OfferStatus, matchSlot: undefined } : x)) },
    { kind: "Your action", actor: "Deborah", area: "Bookings", text: "Offer withdrawn for waitlist entry " + waitlistId + ".", link: { page: "Bookings", tab: "waitlist" } }));
}

/* Inbox */
const VARIANTS: Record<string, string[]> = {
  "CONV-01": ["Hi Aoife, good news: I've a consultation free today at 14:00 in Milltown. Shall I pop you in? Deborah"],
  "CONV-02": ["Hi, thanks for the message. Thursday at 11:40 is free for a first consultation. Want me to hold it for you? Deborah"],
  "CONV-03": ["Hi, I'm in Milltown right beside the Eurospar. Parking is on the street outside. I'll send a map pin with your booking. Deborah"],
};
export function editDraft(id: string, text: string) {
  setP((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? { ...c, draft: text, draftState: "Ready" } : c)) }));
}
export function regenerateDraft(id: string) {
  setP((s) => ({ ...s, conversations: s.conversations.map((c) => {
    if (c.id !== id) return c;
    const base = F.CONVERSATIONS.find((x) => x.id === id)!;
    const alts = [base.draft || "", ...(VARIANTS[id] || [base.draft ? base.draft.replace(/^Hi,? ?/, "Hello, ") : ""])];
    const variant = (c.variant + 1) % alts.length;
    return { ...c, variant, draft: alts[variant], draftState: "Ready" as const };
  }) }));
  toast("Draft regenerated in demo. Same facts, different wording.");
}
export function rejectDraft(id: string) {
  setP((s) => withEvent({ ...s, conversations: s.conversations.map((c) => (c.id === id ? { ...c, draftState: "Rejected" as const, category: "Personal review" as F.ConvCategory, owner: "Deborah" as const } : c)) },
    { kind: "Your action", actor: "Deborah", area: "Administration", text: "Deborah rejected the draft for " + id + " and will reply herself.", link: { page: "Inbox", tab: "conversations", id } }));
}
/** Approve a draft. It becomes "Sent in demo": nothing is actually sent. */
export function approveDraft(id: string): Result {
  const c = state.conversations.find((x) => x.id === id);
  if (!c || !c.draft) return { ok: false, error: "No draft." };
  let s: ClinicState = { ...state, conversations: state.conversations.map((x) => (x.id === id ? { ...x, state: "Sent in demo" as ConvState, draftState: "Sent in demo" as const, sentText: x.draft } : x)) };
  s = { ...s, waitlist: s.waitlist.map((w) => (w.conversationId === id && w.status === "Offer drafted" ? { ...w, status: "Sent in demo" as F.OfferStatus } : w)) };
  s = withEvent(s, { kind: "Your action", actor: "Deborah", area: "Administration",
    text: "Deborah approved a reply to " + c.contactName + " (" + c.purpose.toLowerCase() + "). Marked sent in demo; nothing left Pulse.", link: { page: "Inbox", tab: "conversations", id } });
  commit(s);
  toast("Approved. Marked “Sent in demo”: no message was actually sent.");
  return { ok: true };
}
/** For conversations Deborah handles herself. */
export function closeConversation(id: string) {
  const c = state.conversations.find((x) => x.id === id);
  if (!c) return;
  setP((s) => withEvent({ ...s, conversations: s.conversations.map((x) => (x.id === id ? { ...x, state: "Closed" as ConvState } : x)) },
    { kind: "Your action", actor: "Deborah", area: c.purpose === "Clinical question" ? "Clinical" : "Administration", text: "Deborah marked " + c.contactName + "'s conversation as handled personally.", link: { page: "Inbox", tab: "conversations", id } }));
}

/* Finance */
export function matchReceipt(txId: string, patientId: string, appointmentId?: string): Result {
  const t = state.transactions.find((x) => x.id === txId);
  if (!t) return { ok: false, error: "Receipt not found." };
  if (t.kind !== "Receipt") return { ok: false, error: "Only receipts can be matched." };
  if (t.matched) return { ok: false, error: "Already matched. A receipt is never allocated twice." };
  const p = state.patients.find((x) => x.id === patientId);
  if (!p) return { ok: false, error: "Choose a patient." };
  let s: ClinicState = { ...state, transactions: state.transactions.map((x) => (x.id === txId ? { ...x, matched: true, patientId, appointmentId, counterparty: p.name } : x)) };
  s = { ...s, runDecisions: txId === F.PROPOSED_MATCH_TX ? { ...s.runDecisions, "RUN-03": "Approved" } : s.runDecisions };
  s = withEvent(s, { kind: "Your action", actor: "Deborah", area: "Finance",
    text: "Deborah allocated a received payment of €" + t.amount + " to " + p.name + ". Cash and revenue are unchanged; only the allocation was recorded.", link: { page: "Finance", tab: "transactions", id: txId } });
  commit(s);
  return { ok: true };
}
export function rejectProposal(txId: string) {
  setP((s) => withEvent({ ...s, transactions: s.transactions.map((x) => (x.id === txId ? { ...x, proposedPatientId: undefined, proposedAppointmentId: undefined, proposedConfidence: undefined } : x)),
    runDecisions: txId === F.PROPOSED_MATCH_TX ? { ...s.runDecisions, "RUN-03": "Rejected" } : s.runDecisions },
    { kind: "Your action", actor: "Deborah", area: "Finance", text: "Deborah rejected the Finance Agent's proposed match for " + txId + ".", link: { page: "Finance", tab: "transactions" } }));
}

/* Marketing */
export function editCaption(postId: string, caption: string) {
  setP((s) => ({ ...s, posts: s.posts.map((p) => (p.id === postId ? { ...p, caption } : p)) }));
}
export function setPostTime(postId: string, date: string, time: string) {
  setP((s) => ({ ...s, posts: s.posts.map((p) => (p.id === postId ? { ...p, date, time } : p)) }));
}
/** Approve and schedule in the demo. Nothing is published to Instagram. */
export function approvePost(postId: string) {
  const p = state.posts.find((x) => x.id === postId);
  if (!p) return;
  setP((s) => withEvent({ ...s, posts: s.posts.map((x) => (x.id === postId ? { ...x, status: "Scheduled in demo" as F.PostStatus } : x)) },
    { kind: "Your action", actor: "Deborah", area: "Marketing", text: "Deborah approved “" + p.title + "”, scheduled in demo for " + dayLabel(p.date) + " " + p.time + ". Not posted to Instagram.", link: { page: "Marketing", tab: "planner" } }));
  toast("Scheduled in demo. Nothing was posted to Instagram.");
}
export function returnPostToDraft(postId: string) {
  setP((s) => ({ ...s, posts: s.posts.map((x) => (x.id === postId ? { ...x, status: "Awaiting approval" as F.PostStatus } : x)) }));
}

/* Patients */
export function resolvePrep(prepId: string) {
  const pc = F.PREP_CHECKS.find((x) => x.id === prepId);
  if (!pc) return;
  const name = state.patients.find((p) => p.id === pc.patientId)!.name;
  setP((s) => withEvent({ ...s, prepResolved: { ...s.prepResolved, [prepId]: true },
    patients: s.patients.map((p) => (p.id !== pc.patientId ? p
      : pc.kind === "Intake form" ? { ...p, intake: "Complete" as const }
      : pc.kind === "Consent document" ? { ...p, consentDocs: "On file" as const } : p)) },
    { kind: "Your action", actor: "Deborah", area: "Administration", text: "Preparation check cleared for " + name + ": " + pc.kind.toLowerCase() + ".", link: { page: "Patients", tab: "preparation" } }));
}
export function reopenPrep(prepId: string) {
  setP((s) => ({ ...s, prepResolved: { ...s.prepResolved, [prepId]: false } }));
}

/* Work */
export function setTaskStatus(taskId: string, status: F.TaskStatus) {
  setP((s) => ({ ...s, taskStatus: { ...s.taskStatus, [taskId]: status } }));
}
export function addTask(t: Omit<F.Task, "id" | "status">): string {
  const id = "TSK-D" + String(state.addedTasks.length + 1).padStart(2, "0");
  setP((s) => withEvent({ ...s, addedTasks: [{ ...t, id, status: "To do" }, ...s.addedTasks] },
    { kind: "Your action", actor: "Deborah", area: t.area, text: "Task added: " + t.title + ".", link: { page: "Work", tab: "tasks" } }));
  return id;
}
export function toggleOnboarding(itemId: string) {
  const item = F.ONBOARDING.find((o) => o.id === itemId)!;
  const next = !state.onboarding[itemId];
  setP((s) => {
    const ob = { ...s.onboarding, [itemId]: next };
    const done = Object.values(ob).filter(Boolean).length;
    return withEvent({ ...s, onboarding: ob }, { kind: "Your action", actor: "Deborah", area: "Administration",
      text: (next ? "Completed" : "Reopened") + " onboarding item “" + item.title + "”. Practitioner onboarding at " + Math.round((done / F.ONBOARDING.length) * 100) + "%.", link: { page: "Work", tab: "onboarding" } });
  });
}

export function setFollowup(id: string, status: "Scheduled" | "Reviewed" | "Skipped", label: string) {
  setP((s) => withEvent({ ...s, followups: { ...s.followups, [id]: status } },
    { kind: "Your action", actor: "Deborah", area: "Administration", text: "Follow-up reminder " + status.toLowerCase() + ": " + label + ".", link: { page: "Patients", tab: "followups" } }));
}

/* Agents and settings */
export function toggleAgent(id: F.AgentId) {
  const paused = !state.agentsPaused[id];
  const name = F.AGENTS.find((a) => a.id === id)!.name;
  setP((s) => withEvent({ ...s, agentsPaused: { ...s.agentsPaused, [id]: paused } },
    { kind: "Your action", actor: "Deborah", area: "Administration", text: name + (paused ? " paused." : " resumed."), link: { page: "Agents", tab: "controls" } }));
}
export function decideRun(runId: string, decision: F.RunApproval) {
  setP((s) => ({ ...s, runDecisions: { ...s.runDecisions, [runId]: decision } }));
}
const SETTING_LABELS: Partial<Record<keyof Settings, string>> = {
  notifyDrafts: "draft notifications", notifyPayments: "payment notifications", notifyPrep: "preparation notifications", dailyBriefing: "daily briefing",
  draftFirst: "draft-first", escalateSensitive: "sensitive-topic escalation", allowFinanceData: "finance data for agents",
  allowMarketingUsePatientData: "patient data for marketing", quietHours: "quiet hours", timezone: "timezone",
};
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  setP((s) => withEvent({ ...s, settings: { ...s.settings, [key]: value } },
    { kind: "Your action", actor: "Deborah", area: "Administration", text: "Setting changed: " + (SETTING_LABELS[key] || String(key)) + " " + (value === true ? "on" : value === false ? "off" : String(value)) + ".",
      link: { page: "Settings", tab: String(key).startsWith("notify") || key === "dailyBriefing" || key === "timezone" ? "experience" : "ai" } }));
}
export function logEvent(e: Omit<F.ActivityEvent, "id" | "at">) {
  setP((s) => withEvent(s, e));
}

/** Restore every fixture. Clears the namespaced storage key. */
export function reset() {
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
  commit(fresh());
  uiCommit({ patientDrawer: null, focus: {}, toast: null, toastSeq: ui.toastSeq + 1 });
  toast("Demo reset. All fictional records restored.");
}
