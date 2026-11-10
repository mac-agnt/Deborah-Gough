/* ─────────────────────────────────────────────────────────────────────────────
   Deborah Gough · Aesthetics Clinic, Milltown, demonstration fixtures.

   EVERYTHING IN THIS FILE IS FICTIONAL DEMO DATA. Patients, appointments,
   messages, payments, prices and figures are invented to show how Pulse could
   work. Nothing here is a discovered business result.

   One typed model with stable IDs. Pages never hard-code totals: they derive
   them from these rows (see selectors.ts), so a number shown in one module is
   the same number everywhere else.
   ──────────────────────────────────────────────────────────────────────────── */

import { addDays, fromMin, toMin } from "./format";

/* ── deterministic random ───────────────────────────────────────────────── */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── identity ───────────────────────────────────────────────────────────── */
export const ORG = {
  name: "Deborah Gough",
  descriptor: "Aesthetics Clinic · Milltown",
  monogram: "DG",
  legalName: "Deborah Gough",
  structure: "Sole trader",
  tradingName: "Unconfirmed",
  profession: "Nurse (as described by Deborah)",
  location: "Milltown, Dublin, near the Eurospar",
  premises: "Rented clinic space, shared with a plastic surgeon",
  website: "Awaiting confirmation",
  websiteNote: "Existing one-page Carrd site; purchased .ie domain not yet supplied",
  businessEmail: "Not supplied",
  association: "Public LinkedIn post links Deborah to Collective Regen (association only; current trading name unconfirmed)",
};

/* ── services (illustrative prices and durations) ───────────────────────── */
export type ServiceId = "consult" | "skin" | "micro" | "hair" | "review";
export type RevenueArea = "Consultations" | "Skin" | "Hair & scalp";
export interface Service {
  id: ServiceId;
  name: string;
  price: number;
  duration: number;
  /** Room reset time after the appointment, in minutes. */
  turnover: number;
  area: RevenueArea;
  forNewPatients: boolean;
  room: RoomId;
}
export const SERVICES: Service[] = [
  { id: "consult", name: "Initial consultation", price: 60, duration: 30, turnover: 0, area: "Consultations", forNewPatients: true, room: "ROOM-B" },
  { id: "skin", name: "Skin review", price: 80, duration: 30, turnover: 5, area: "Skin", forNewPatients: true, room: "ROOM-A" },
  { id: "micro", name: "Microneedling appointment", price: 180, duration: 60, turnover: 5, area: "Skin", forNewPatients: false, room: "ROOM-A" },
  { id: "hair", name: "Hair and scalp consultation", price: 90, duration: 45, turnover: 5, area: "Hair & scalp", forNewPatients: true, room: "ROOM-A" },
  { id: "review", name: "Follow-up review", price: 0, duration: 15, turnover: 0, area: "Consultations", forNewPatients: false, room: "ROOM-B" },
];
export const SERVICE_BY_ID: Record<ServiceId, Service> = Object.fromEntries(SERVICES.map((s) => [s.id, s])) as Record<ServiceId, Service>;

/** Planned-expansion only. Not bookable today. */
export const EXPANSION_SERVICES = [
  { name: "Laser appointment (planned)", note: "Only once the second practitioner, room time and documentation are confirmed" },
];

/* ── people ─────────────────────────────────────────────────────────────── */
export type PersonState = "Active" | "Planned" | "Not invited";
export interface Person {
  id: string;
  name: string;
  initials: string;
  role: string;
  state: PersonState;
  access: string;
  note: string;
}
export const PEOPLE: Person[] = [
  { id: "PER-DG", name: "Deborah Gough", initials: "DG", role: "Owner and practitioner", state: "Active", access: "Owner · full access", note: "The only active user." },
  { id: "PER-EB", name: "Emma Byrne", initials: "EB", role: "Prospective laser practitioner (fictional placeholder)", state: "Planned", access: "No access yet", note: "Stand-in for the unnamed candidate. Not employed; no account exists." },
  { id: "PER-ACC", name: "Accountant", initials: "AC", role: "External reviewer (name not supplied)", state: "Not invited", access: "Accountant pack only, when invited", note: "Would see finance exports, never patient records." },
];

export const WORK_AREAS = ["Clinical", "Administration", "Marketing", "Finance"] as const;
export type WorkArea = (typeof WORK_AREAS)[number];

/* ── rooms and practitioners ────────────────────────────────────────────── */
export type RoomId = "ROOM-A" | "ROOM-B";
export const ROOMS: { id: RoomId; name: string; note: string }[] = [
  { id: "ROOM-A", name: "Treatment room", note: "Shared premises; the plastic surgeon uses it Mon and Wed" },
  { id: "ROOM-B", name: "Consult room", note: "Consultations and follow-up reviews" },
];
export const PRACTITIONERS = [
  { id: "PER-DG", name: "Deborah Gough", active: true },
  { id: "PER-EB", name: "Emma Byrne (planned)", active: false },
];

/* ── clinic hours ───────────────────────────────────────────────────────── */
export const HOURS = {
  open: "09:00",
  close: "19:00",
  breaks: [{ start: "13:00", end: "13:30", label: "Lunch" }],
  days: ["Tue", "Thu", "Fri"],
  note: "Three configured clinic days. Deborah has reported far longer days; the demo does not use those as the default.",
};

/* ── calendar weeks ─────────────────────────────────────────────────────── */
export const LAST_WEEK = ["2026-11-03", "2026-11-05", "2026-11-06"];
export const THIS_WEEK = ["2026-11-10", "2026-11-12", "2026-11-13"];
export const NEXT_WEEK = ["2026-11-17", "2026-11-19", "2026-11-20"];
export const CLINIC_DAYS = [...LAST_WEEK, ...THIS_WEEK, ...NEXT_WEEK];

/* One day template: 20 bookable slots. Times respect the service length,
   a 5-minute room turnover after treatments, and the lunch break. */
const TEMPLATE: { start: string; kind: ServiceId; len: number }[] = [
  { start: "09:00", kind: "review", len: 15 },
  { start: "09:15", kind: "consult", len: 30 },
  { start: "09:45", kind: "skin", len: 30 },
  { start: "10:20", kind: "micro", len: 60 },
  { start: "11:25", kind: "review", len: 15 },
  { start: "11:40", kind: "consult", len: 30 },
  { start: "12:10", kind: "review", len: 15 },
  { start: "12:25", kind: "skin", len: 30 },
  { start: "13:30", kind: "review", len: 15 },
  { start: "13:45", kind: "review", len: 15 },
  { start: "14:00", kind: "consult", len: 30 },
  { start: "14:30", kind: "consult", len: 30 },
  { start: "15:00", kind: "consult", len: 30 },
  { start: "15:30", kind: "review", len: 15 },
  { start: "15:45", kind: "review", len: 15 },
  { start: "16:00", kind: "consult", len: 30 },
  { start: "16:30", kind: "hair", len: 45 },
  { start: "17:20", kind: "skin", len: 30 },
  { start: "17:55", kind: "skin", len: 30 },
  { start: "18:30", kind: "review", len: 15 },
];

export interface Slot {
  id: string;
  date: string;
  start: string;
  end: string;
  /** Bookable minutes. A service fits if its duration is no longer. */
  length: number;
  kind: ServiceId;
  room: RoomId;
  practitioner: string;
}

let slotN = 0;
export const SLOTS: Slot[] = [];
for (const date of CLINIC_DAYS) {
  for (const t of TEMPLATE) {
    slotN++;
    let id = "SLOT-" + String(slotN).padStart(3, "0");
    // The two open consultation gaps today carry the IDs the story uses.
    if (date === "2026-11-10" && t.start === "14:00") id = "SLOT-101";
    if (date === "2026-11-10" && t.start === "16:00") id = "SLOT-102";
    SLOTS.push({
      id, date, start: t.start, end: fromMin(toMin(t.start) + t.len), length: t.len, kind: t.kind,
      room: SERVICE_BY_ID[t.kind].room, practitioner: "PER-DG",
    });
  }
}
/* Renumber any accidental clash with the two reserved story IDs. */
for (const s of SLOTS) {
  if ((s.id === "SLOT-101" && !(s.date === "2026-11-10" && s.start === "14:00")) ||
      (s.id === "SLOT-102" && !(s.date === "2026-11-10" && s.start === "16:00"))) s.id = s.id.replace("SLOT-", "SLOT-X");
}
export const SLOT_BY_ID: Record<string, Slot> = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

/* Open slots this week: two per clinic day (6 in total). */
const OPEN_THIS_WEEK: Record<string, string[]> = {
  "2026-11-10": ["14:00", "16:00"],
  "2026-11-12": ["11:40", "17:20"],
  "2026-11-13": ["13:30", "14:00"],
};
/* Next week is lighter: 7 open slots per day. */
const OPEN_NEXT_WEEK = ["09:15", "11:40", "14:00", "15:00", "15:45", "16:00", "17:55"];
/* Last week: every slot was used. */

/* ── patients ───────────────────────────────────────────────────────────── */
export const TARGET_AREAS = ["Milltown", "Dundrum", "Blackrock", "Deansgrange", "Monkstown"];
const OTHER_AREAS = ["Ranelagh", "Rathmines", "Clonskeagh", "Churchtown", "Rathgar", "Terenure", "Stillorgan", "Sandyford",
  "Donnybrook", "Ballsbridge", "Booterstown", "Dún Laoghaire", "Clontarf", "Drumcondra", "Lucan", "Swords", "Bray", "Greystones", "Naas", "Tallaght"];
export type Source = "Instagram" | "Referral" | "Website" | "Walk-in";
export type ContactPref = "Instagram DM" | "WhatsApp" | "Phone" | "Email";

export interface Patient {
  id: string;
  first: string;
  last: string;
  name: string;
  locality: string;
  targetArea: boolean;
  source: Source;
  contactPref: ContactPref;
  /** Fictional, reserved-domain address. */
  email: string;
  phoneMasked: string;
  /** When the record was created (first enquiry). Visit history is derived from appointments. */
  registered: string;
  intake: "Complete" | "Incomplete" | "Not started";
  consentDocs: "On file" | "Review needed" | "Not required yet";
  notes: string;
}

const FIRST_F = ["Ciara", "Siobhán", "Róisín", "Sinéad", "Clodagh", "Gráinne", "Éabha", "Caoimhe", "Saoirse", "Aisling", "Méabh", "Laura",
  "Rachel", "Hannah", "Katie", "Grace", "Chloe", "Lucy", "Amy", "Fiona", "Deirdre", "Louise", "Claire", "Jennifer", "Michelle", "Nicola",
  "Lisa", "Karen", "Sharon", "Paula", "Úna", "Eimear", "Ailbhe", "Doireann", "Muireann", "Sorcha", "Áine", "Nuala", "Rebecca", "Jessica"];
const FIRST_M = ["Conor", "Cian", "Darragh", "Eoin", "Seán", "Ciarán", "Niall", "Rory", "Dara", "Fionn", "Mark", "David", "Paul", "Brian", "Kevin"];
const LAST = ["Doyle", "McCarthy", "Gallagher", "Doherty", "Kennedy", "Lynch", "Murray", "Quinn", "Moore", "McLoughlin", "Carroll",
  "Connolly", "Daly", "O'Connor", "Brennan", "Burke", "Collins", "Clarke", "Hughes", "Farrell", "Fitzgerald", "Martin", "Maguire",
  "Nolan", "Flynn", "Callaghan", "O'Donnell", "Duffy", "Boyle", "Healy", "Sweeney", "Hayes", "Kavanagh", "Power", "McGrath", "Moran",
  "Brady", "Casey", "Foley", "Fitzpatrick", "Donnelly", "Regan", "Keane", "Whelan", "Tierney", "Corcoran", "Dolan", "Hennessy"];

/* Named story patients keep fixed IDs. */
const NAMED: Record<number, Partial<Patient> & { first: string; last: string }> = {
  41: { first: "Aoife", last: "Murphy", locality: "Clonskeagh", source: "Instagram", contactPref: "Instagram DM", notes: "On the waitlist for a consultation." },
  72: { first: "Niamh", last: "Kelly", locality: "Dundrum", source: "Instagram", contactPref: "WhatsApp", notes: "Paid by transfer on 6 Nov; receipt awaiting allocation." },
  93: { first: "Orla", last: "Walsh", locality: "Rathgar", source: "Referral", contactPref: "Phone", consentDocs: "Review needed", notes: "Consent-document review task open before Thursday." },
  118: { first: "Sarah", last: "Byrne", locality: "Milltown", source: "Instagram", contactPref: "Instagram DM", intake: "Incomplete", notes: "Intake form started but not finished." },
};

const r = rng(20261110);
const pick = <T,>(list: readonly T[]) => list[Math.floor(r() * list.length)];

function localityFor(i: number): string {
  // Spread across Dublin; about a third in the target areas.
  const x = r();
  if (x < 0.34) return TARGET_AREAS[i % TARGET_AREAS.length];
  return OTHER_AREAS[Math.floor(r() * OTHER_AREAS.length)];
}
function sourceFor(): Source {
  const x = r();
  return x < 0.7 ? "Instagram" : x < 0.88 ? "Referral" : x < 0.95 ? "Website" : "Walk-in";
}
function prefFor(src: Source): ContactPref {
  if (src === "Instagram") return r() < 0.75 ? "Instagram DM" : "WhatsApp";
  const x = r();
  return x < 0.4 ? "WhatsApp" : x < 0.7 ? "Phone" : "Email";
}
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

const usedNames = new Set<string>(Object.values(NAMED).map((n) => n.first + " " + n.last));
usedNames.add("Emma Byrne");

export const PATIENTS: Patient[] = [];
for (let i = 1; i <= 240; i++) {
  const named = NAMED[i];
  let first: string, last: string;
  if (named) { first = named.first; last = named.last; }
  else {
    do {
      first = r() < 0.86 ? pick(FIRST_F) : pick(FIRST_M);
      last = pick(LAST);
    } while (usedNames.has(first + " " + last));
    usedNames.add(first + " " + last);
  }
  const source = named?.source || sourceFor();
  const locality = named?.locality || localityFor(i);
  // Older IDs joined earlier. First visits run from Jan 2025 to Oct 2026.
  const registered = addDays("2025-01-14", Math.floor((i / 240) * 640));
  PATIENTS.push({
    id: "PAT-" + String(i).padStart(3, "0"),
    first, last, name: first + " " + last,
    locality, targetArea: TARGET_AREAS.includes(locality),
    source, contactPref: named?.contactPref || prefFor(source),
    email: slug(first) + "." + slug(last) + "@patient.example",
    phoneMasked: "08" + (5 + (i % 5)) + " ••• •" + String(100 + ((i * 37) % 900)),
    registered,
    intake: named?.intake || "Complete",
    consentDocs: named?.consentDocs || (i % 3 === 0 ? "On file" : "Not required yet"),
    notes: named?.notes || "",
  });
}
export const PATIENT_BY_ID: Record<string, Patient> = Object.fromEntries(PATIENTS.map((p) => [p.id, p]));

/* New patients this week: 18, of whom 9 live in the target areas.
   Sarah Byrne (PAT-118) registered earlier but first visits this week. */
const NEW_LOCALITIES = [
  "Milltown", "Milltown", "Milltown", "Dundrum", "Dundrum", "Blackrock", "Blackrock", "Deansgrange", "Monkstown",
  "Ranelagh", "Rathmines", "Terenure", "Rathgar", "Clontarf", "Lucan", "Swords", "Bray", "Naas",
];
const pid = (n: number) => "PAT-" + String(n).padStart(3, "0");
export const NEW_THIS_WEEK_IDS = [118, ...Array.from({ length: 17 }, (_, k) => 224 + k)].map(pid);
NEW_THIS_WEEK_IDS.forEach((id, k) => {
  const p = PATIENT_BY_ID[id];
  p.locality = NEW_LOCALITIES[k];
  p.targetArea = TARGET_AREAS.includes(p.locality);
  p.source = k % 6 === 5 ? "Referral" : "Instagram";
  p.contactPref = p.source === "Instagram" ? "Instagram DM" : "WhatsApp";
  if (id !== "PAT-118") p.registered = addDays("2026-10-26", k % 14);
});
/* Last week's new patients (now returning) and next week's first visits. */
const LAST_WEEK_NEW = Array.from({ length: 18 }, (_, k) => pid(205 + k));
const NEXT_WEEK_NEW = [pid(200), pid(201), pid(202)];
LAST_WEEK_NEW.forEach((id, k) => { PATIENT_BY_ID[id].registered = addDays("2026-10-19", k % 14); });
NEXT_WEEK_NEW.forEach((id, k) => { PATIENT_BY_ID[id].registered = addDays("2026-11-02", k * 2); });
/* Waitlisted people who have never visited. */
const NEVER_VISITED = [pid(41), pid(132), pid(203)];
PATIENT_BY_ID[pid(41)].registered = "2026-11-04";
PATIENT_BY_ID[pid(132)].registered = "2026-11-08";
PATIENT_BY_ID[pid(203)].registered = "2026-11-05";

/* ── appointments ───────────────────────────────────────────────────────── */
export type ApptStatus = "Booked" | "Confirmed" | "Attended" | "Did not attend" | "Cancelled";
export interface Appointment {
  id: string;
  slotId: string;
  patientId: string;
  serviceId: ServiceId;
  status: ApptStatus;
  /** First ever visit to the clinic. */
  isNew: boolean;
  bookedVia: "Instagram DM" | "WhatsApp" | "Phone" | "Online booking (demo)" | "In clinic";
}

export const APPOINTMENTS: Appointment[] = [];
let apN = 0;
const mkAppt = (slot: Slot, patientId: string, serviceId: ServiceId, isNew: boolean, status: ApptStatus): Appointment => {
  apN++;
  const pat = PATIENT_BY_ID[patientId];
  return {
    id: "APT-" + String(apN).padStart(4, "0"), slotId: slot.id, patientId, serviceId, status, isNew,
    bookedVia: pat.contactPref === "Email" ? "Phone" : (pat.contactPref as Appointment["bookedVia"]),
  };
};

/* Fixed placements so every story reference points at a real appointment. */
const FIXED: Record<string, { pid: string; service: ServiceId; isNew: boolean }> = {
  // last week
  "2026-11-03 10:20": { pid: pid(12), service: "micro", isNew: false },
  "2026-11-03 09:45": { pid: pid(27), service: "skin", isNew: false },
  "2026-11-05 10:20": { pid: pid(72), service: "micro", isNew: false },   // Niamh Kelly, paid by transfer 6 Nov
  "2026-11-05 16:30": { pid: pid(48), service: "hair", isNew: false },
  "2026-11-05 09:15": { pid: pid(208), service: "consult", isNew: true },
  "2026-11-05 12:10": { pid: pid(19), service: "review", isNew: false },  // feedback in CONV-10
  // this week
  "2026-11-10 14:30": { pid: pid(118), service: "consult", isNew: true },  // Sarah Byrne, incomplete intake
  "2026-11-10 16:30": { pid: pid(226), service: "hair", isNew: true },     // contact-detail check
  "2026-11-12 10:20": { pid: pid(93), service: "micro", isNew: false },    // Orla Walsh, consent review
  "2026-11-12 14:00": { pid: pid(230), service: "consult", isNew: true },  // asks what to bring (CONV-06)
  "2026-11-13 09:45": { pid: pid(61), service: "skin", isNew: false },     // questionnaire check
  "2026-11-13 11:25": { pid: pid(140), service: "review", isNew: false },  // confirms Friday (CONV-07)
  "2026-11-13 15:45": { pid: pid(97), service: "review", isNew: false },   // can't make Friday (CONV-04)
  // next week
  "2026-11-19 10:20": { pid: pid(112), service: "micro", isNew: false },   // clinical question (CONV-09)
};
const fixedIn = (days: string[]) => Object.keys(FIXED).filter((k) => days.includes(k.slice(0, 10))).map((k) => FIXED[k].pid);

const WAITLIST_IDS = [41, 203, 188, 150, 215, 132].map(pid);
const EXCLUDED = new Set<string>([...NEW_THIS_WEEK_IDS, ...NEXT_WEEK_NEW, ...NEVER_VISITED, ...WAITLIST_IDS]);
const returningPool = PATIENTS.map((p) => p.id).filter((id) => !EXCLUDED.has(id) && Number(id.slice(4)) <= 222);
let retCursor = 0;
function nextReturning(used: Set<string>, extraBlock: Set<string>): string {
  for (let k = 0; k < returningPool.length; k++) {
    const id = returningPool[(retCursor + k) % returningPool.length];
    if (!used.has(id) && !extraBlock.has(id)) { retCursor = (retCursor + k + 13) % returningPool.length; used.add(id); return id; }
  }
  throw new Error("returning pool exhausted");
}

for (const week of [LAST_WEEK, THIS_WEEK, NEXT_WEEK]) {
  const used = new Set<string>(fixedIn(week));
  const isLast = week === LAST_WEEK, isThis = week === THIS_WEEK, isNext = week === NEXT_WEEK;
  const newQueue = (isLast ? LAST_WEEK_NEW : isThis ? NEW_THIS_WEEK_IDS : NEXT_WEEK_NEW).filter((id) => !used.has(id));
  // Last week's new patients can't also be "returning" in that same week.
  const block = new Set<string>(isLast ? LAST_WEEK_NEW : []);
  for (const date of week) {
    for (const slot of SLOTS.filter((s) => s.date === date)) {
      if (isThis && OPEN_THIS_WEEK[date].includes(slot.start)) continue;
      if (isNext && OPEN_NEXT_WEEK.includes(slot.start)) continue;
      const fixed = FIXED[date + " " + slot.start];
      let who: string, service: ServiceId = slot.kind, isNew = false;
      const takesNew = slot.kind === "consult" || (isThis && slot.kind === "hair") || (isThis && date === "2026-11-12" && slot.start === "09:45");
      if (fixed) { who = fixed.pid; service = fixed.service; isNew = fixed.isNew; }
      else if (takesNew && newQueue.length) { who = newQueue.shift() as string; isNew = true; used.add(who); }
      else {
        who = nextReturning(used, block);
        // A returning patient in a consultation-length slot books a review.
        if (slot.kind === "consult") service = "review";
      }
      const status: ApptStatus = isLast
        ? (date === "2026-11-05" && slot.start === "15:45" ? "Did not attend" : "Attended")
        : date === "2026-11-10" ? "Confirmed" : "Booked";
      APPOINTMENTS.push(mkAppt(slot, who, service, isNew, status));
    }
  }
}
export const APPT_BY_ID: Record<string, Appointment> = Object.fromEntries(APPOINTMENTS.map((a) => [a.id, a]));

/* ── preparation checks (administrative only) ───────────────────────────── */
export interface PrepCheck {
  id: string;
  patientId: string;
  /** Matched to the appointment at runtime by patient and date. */
  date: string;
  issue: string;
  kind: "Intake form" | "Consent document" | "Contact details" | "Questionnaire";
  action: string;
}
export const PREP_CHECKS: PrepCheck[] = [
  { id: "PREP-01", patientId: "PAT-118", date: "2026-11-10", kind: "Intake form", issue: "Intake form incomplete: medical-history section not submitted", action: "Send the intake form link again" },
  { id: "PREP-02", patientId: "PAT-093", date: "2026-11-12", kind: "Consent document", issue: "Consent document needs Deborah's review before the appointment", action: "Review the consent document on file" },
  { id: "PREP-03", patientId: "PAT-226", date: "2026-11-10", kind: "Contact details", issue: "Mobile number missing; only an Instagram handle on file", action: "Ask for a contact number" },
  { id: "PREP-04", patientId: "PAT-061", date: "2026-11-13", kind: "Questionnaire", issue: "Pre-appointment questionnaire not returned", action: "Resend the questionnaire" },
];

/* ── waitlist ───────────────────────────────────────────────────────────── */
export type OfferStatus = "Not offered" | "Offer drafted" | "Sent in demo" | "Booked" | "Declined";
export interface WaitlistEntry {
  id: string;
  patientId: string;
  serviceId: ServiceId;
  suitable: string;
  contactPref: ContactPref;
  added: string;
  status: OfferStatus;
  /** The slot the Booking Agent matched, if any. */
  matchSlot?: string;
  conversationId?: string;
}
export const WAITLIST: WaitlistEntry[] = [
  { id: "WL-01", patientId: "PAT-041", serviceId: "consult", suitable: "Weekday afternoons", contactPref: "Instagram DM", added: "2026-11-04", status: "Offer drafted", matchSlot: "SLOT-101", conversationId: "CONV-01" },
  { id: "WL-02", patientId: "PAT-203", serviceId: "consult", suitable: "Thursdays, any time", contactPref: "Instagram DM", added: "2026-11-05", status: "Not offered" },
  { id: "WL-03", patientId: "PAT-188", serviceId: "skin", suitable: "Late afternoons", contactPref: "WhatsApp", added: "2026-11-05", status: "Not offered" },
  { id: "WL-04", patientId: "PAT-150", serviceId: "micro", suitable: "Fridays only", contactPref: "Phone", added: "2026-11-06", status: "Not offered" },
  { id: "WL-05", patientId: "PAT-215", serviceId: "hair", suitable: "Mornings", contactPref: "Instagram DM", added: "2026-11-07", status: "Not offered" },
  { id: "WL-06", patientId: "PAT-132", serviceId: "consult", suitable: "Any time after 16:00", contactPref: "WhatsApp", added: "2026-11-08", status: "Not offered" },
];

/* ── conversations and drafts ───────────────────────────────────────────── */
export type Channel = "Instagram" | "WhatsApp" | "Email" | "Phone note";
export type ConvCategory = "Draft ready" | "Personal review" | "Awaiting information";
export interface Conversation {
  id: string;
  patientId?: string;
  contactName: string;
  channel: Channel;
  age: string;
  receivedAt: string;
  purpose: string;
  category: ConvCategory;
  owner: "Deborah" | "Inbox Assistant";
  lastMessage: string;
  draft?: string;
  routingNote?: string;
  relatedAppointment?: string;
}
export const CONVERSATIONS: Conversation[] = [
  { id: "CONV-01", patientId: "PAT-041", contactName: "Aoife Murphy", channel: "Instagram", age: "6 days", receivedAt: "2026-11-04 19:12", purpose: "Availability offer", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "Hi Deborah, any chance of a consultation soon? Afternoons suit me best.",
    draft: "Hi Aoife, a consultation slot has opened today at 14:00 in Milltown. Would that suit you? If so I'll pop you in and send on the intake form. Deborah",
    routingNote: "Booking Agent matched SLOT-101 (today 14:00, 30 min) to her waitlist preference." },
  { id: "CONV-02", contactName: "Instagram enquiry", patientId: "PAT-203", channel: "Instagram", age: "14 h", receivedAt: "2026-11-09 18:40", purpose: "Booking request", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "Do you have anything on Thursday for a first consultation?",
    draft: "Hi, thanks for getting in touch. I have a consultation at 11:40 on Thursday if that works for you. Let me know and I'll hold it. Deborah" },
  { id: "CONV-03", contactName: "Instagram enquiry", channel: "Instagram", age: "11 h", receivedAt: "2026-11-09 21:05", purpose: "Location", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "Where's the clinic exactly? Is there parking?",
    draft: "Hi, the clinic is in Milltown, just by the Eurospar. There's on-street parking nearby. I'll send a pin when you book. Deborah" },
  { id: "CONV-04", patientId: "PAT-097", contactName: "", channel: "WhatsApp", age: "9 h", receivedAt: "2026-11-09 23:30", purpose: "Rescheduling", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "Really sorry, I can't make Friday. Could I move to next week?",
    draft: "No problem at all. I have Thursday 19 Nov at 15:00 or Friday 20 Nov at 11:40. Which suits better? Deborah" },
  { id: "CONV-05", contactName: "Instagram enquiry", channel: "Instagram", age: "1 day", receivedAt: "2026-11-09 08:15", purpose: "Prices", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "How much is a consultation?",
    draft: "Hi, an initial consultation is €60 and takes about 30 minutes. We go through everything together and you'll get a clear plan with no pressure. Deborah" },
  { id: "CONV-06", patientId: "PAT-230", contactName: "", channel: "Instagram", age: "16 h", receivedAt: "2026-11-09 16:20", purpose: "Preparation", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "Is there anything I need to bring on Thursday?",
    draft: "Just yourself. I'll send a short intake form before Thursday; if you can fill it in beforehand that saves time on the day. Deborah" },
  { id: "CONV-07", patientId: "PAT-140", contactName: "", channel: "WhatsApp", age: "1 day", receivedAt: "2026-11-09 09:02", purpose: "Booking confirmation", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "Just checking I'm still booked in for Friday?",
    draft: "You are. See you Friday. If anything changes just send me a message here. Deborah" },
  { id: "CONV-08", contactName: "Email enquiry", channel: "Email", age: "2 days", receivedAt: "2026-11-08 12:44", purpose: "Gift voucher question", category: "Draft ready", owner: "Inbox Assistant",
    lastMessage: "Do you do gift vouchers for Christmas?",
    draft: "Thanks for asking. I'm sorting out gift vouchers for Christmas at the moment and will share details on Instagram shortly. I'll message you as soon as they're ready. Deborah" },
  { id: "CONV-09", patientId: "PAT-112", contactName: "", channel: "Instagram", age: "7 h", receivedAt: "2026-11-10 01:15", purpose: "Clinical question", category: "Personal review", owner: "Deborah",
    lastMessage: "I've started a new medication. Is it still OK to go ahead with microneedling next week?",
    routingNote: "Clinical question. Routed to Deborah. No AI draft and no treatment recommendation." },
  { id: "CONV-10", patientId: "PAT-019", contactName: "", channel: "WhatsApp", age: "1 day", receivedAt: "2026-11-09 10:30", purpose: "Feedback", category: "Personal review", owner: "Deborah",
    lastMessage: "Wanted to say thanks for last week, but I was a bit disappointed with the wait on arrival.",
    routingNote: "Personal feedback. Deborah prefers to reply herself." },
  { id: "CONV-11", contactName: "Local business enquiry", channel: "Email", age: "3 days", receivedAt: "2026-11-07 11:05", purpose: "Collaboration request", category: "Personal review", owner: "Deborah",
    lastMessage: "We run a salon in Dundrum and wondered about a referral partnership.",
    routingNote: "Business decision. Left for Deborah." },
  { id: "CONV-12", contactName: "Instagram enquiry", channel: "Instagram", age: "1 day", receivedAt: "2026-11-09 13:50", purpose: "Booking request", category: "Awaiting information", owner: "Inbox Assistant",
    lastMessage: "I'd like to book, I'll check my diary and come back to you with dates.",
    routingNote: "Waiting for the patient to send preferred dates." },
];
for (const c of CONVERSATIONS) if (c.patientId && !c.contactName) c.contactName = PATIENT_BY_ID[c.patientId].name;

export const RESPONSE_LIBRARY = [
  { id: "TPL-01", group: "Booking", title: "Offer a slot", body: "Hi {first}, I have {slot} free in Milltown. Would that suit? If so I'll hold it for you and send on the intake form. Deborah" },
  { id: "TPL-02", group: "Booking", title: "Fully booked, offer the waitlist", body: "Hi {first}, this week is full, but I can add you to the waitlist and message you the moment something opens. Deborah" },
  { id: "TPL-03", group: "Location", title: "Finding the clinic", body: "The clinic is in Milltown, just by the Eurospar. There's on-street parking nearby and I'll send a pin before your appointment." },
  { id: "TPL-04", group: "Rescheduling", title: "Move an appointment", body: "No problem at all, {first}. I have {option1} or {option2}. Which suits better?" },
  { id: "TPL-05", group: "Rescheduling", title: "Late arrival", body: "Thanks for letting me know. I'll keep your slot as long as I can; if it's more than 10 minutes we may need to move it." },
  { id: "TPL-06", group: "Preparation", title: "Before your consultation", body: "Before Thursday I'll send a short intake form. Filling it in beforehand saves time on the day." },
  { id: "TPL-07", group: "Preparation", title: "Intake form reminder", body: "Hi {first}, a quick reminder to finish the intake form before your appointment. Here's the link again." },
];

/* ── content ────────────────────────────────────────────────────────────── */
export type PostStatus = "Published" | "Awaiting approval" | "Scheduled in demo" | "Draft";
export interface Post {
  id: string;
  title: string;
  topic: "Meet Deborah" | "Finding the clinic" | "Behind the scenes" | "Consultation FAQs" | "Availability";
  format: "Photo" | "Carousel" | "Reel" | "Story";
  caption: string;
  status: PostStatus;
  date: string;
  time: string;
  campaignId?: string;
  tint: string;
}
export const POSTS: Post[] = [
  { id: "POST-01", title: "Hello from Milltown", topic: "Meet Deborah", format: "Photo", status: "Published", date: "2026-11-03", time: "19:00", tint: "#9DBBB4",
    caption: "A quick hello from the clinic. I'm Deborah, and I'd love to meet you." },
  { id: "POST-02", title: "A week in the clinic", topic: "Behind the scenes", format: "Reel", status: "Published", date: "2026-11-06", time: "18:30", tint: "#345B57",
    caption: "Set-up, coffee, and a full Friday. Thanks to everyone who came in this week." },
  { id: "POST-03", title: "Meet Deborah", topic: "Meet Deborah", format: "Photo", status: "Awaiting approval", date: "2026-11-11", time: "19:00", tint: "#9DBBB4",
    caption: "Who's behind the clinic? I'm Deborah, a nurse, and every consultation here is with me. Ask me anything below." },
  { id: "POST-04", title: "Finding the clinic", topic: "Finding the clinic", format: "Carousel", status: "Awaiting approval", date: "2026-11-12", time: "12:30", tint: "#243735",
    caption: "Coming to see me in Milltown? The clinic is right by the Eurospar. Swipe for the easiest way in.", campaignId: "CMP-01" },
  { id: "POST-05", title: "Behind the scenes", topic: "Behind the scenes", format: "Reel", status: "Awaiting approval", date: "2026-11-13", time: "18:30", tint: "#345B57",
    caption: "What happens before you arrive: room set-up, your notes ready, and a fresh cup of tea." },
  { id: "POST-06", title: "Consultation FAQs", topic: "Consultation FAQs", format: "Carousel", status: "Awaiting approval", date: "2026-11-15", time: "11:00", tint: "#EFF5F2",
    caption: "Your first consultation, answered: how long it takes, what we talk about, and what happens next." },
  { id: "POST-07", title: "This week's availability", topic: "Availability", format: "Story", status: "Awaiting approval", date: "2026-11-16", time: "09:00", tint: "#9DBBB4",
    caption: "A few consultation slots this week. Message me to grab one." },
];

export interface Campaign {
  id: string;
  name: string;
  status: "Draft";
  spent: number;
  budget: number;
  areas: string[];
  radiusKm: number;
  note: string;
}
export const CAMPAIGNS: Campaign[] = [
  { id: "CMP-01", name: "Local consultations (proposed paid campaign)", status: "Draft", spent: 0, budget: 0, areas: ["Milltown", "Dundrum", "Blackrock", "Deansgrange", "Monkstown"], radiusKm: 5,
    note: "Proposal only. Location settings apply to a paid campaign; organic posts cannot be geographically targeted." },
];

/* Weekly mock funnel, attributed events (not verified Instagram analytics). */
export const FUNNEL_EVENTS = { enquiries: 30, bookingLinkOpens: 24 };

/* ── finance ────────────────────────────────────────────────────────────── */
export type TxKind = "Receipt" | "Expense";
export type CostCategory = "Room rental" | "Consumables" | "Insurance" | "Software and communications" | "Other business expenses";
export interface Transaction {
  id: string;
  date: string;
  kind: TxKind;
  description: string;
  counterparty: string;
  amount: number;
  source: "Revolut CSV (demo import)" | "Manual entry";
  area?: RevenueArea;
  category?: CostCategory;
  /** For receipts: allocated patient. */
  patientId?: string;
  appointmentId?: string;
  matched: boolean;
  /** For expenses: is a receipt document on file? */
  docOnFile?: boolean;
  proposedPatientId?: string;
  proposedAppointmentId?: string;
  proposedConfidence?: string;
}
export const TRANSACTIONS: Transaction[] = [];
let txN = 0;
const tx = (t: Omit<Transaction, "id">) => { txN++; TRANSACTIONS.push({ id: "TX-" + String(txN).padStart(4, "0"), ...t }); };

/* October revenue as batched Revolut card settlements per clinic day. */
const OCT_DAYS = ["2026-10-01", "2026-10-02", "2026-10-06", "2026-10-08", "2026-10-09", "2026-10-13", "2026-10-15", "2026-10-16",
  "2026-10-20", "2026-10-22", "2026-10-23", "2026-10-27", "2026-10-29", "2026-10-30"];
function split(total: number, n: number, seed: number): number[] {
  const rr = rng(seed);
  const w = Array.from({ length: n }, () => 0.7 + rr() * 0.6);
  const sum = w.reduce((a, b) => a + b, 0);
  const out = w.map((x) => Math.round((total * x) / sum / 10) * 10);
  out[n - 1] += total - out.reduce((a, b) => a + b, 0);
  return out;
}
const octCons = split(2400, OCT_DAYS.length, 11);
const octSkin = split(9600, OCT_DAYS.length, 12);
const octHair = split(4800, OCT_DAYS.length, 13);
OCT_DAYS.forEach((d, k) => {
  tx({ date: d, kind: "Receipt", description: "Card settlement · consultations", counterparty: "Revolut card payments", amount: octCons[k], source: "Revolut CSV (demo import)", area: "Consultations", matched: true });
  tx({ date: d, kind: "Receipt", description: "Card settlement · skin appointments", counterparty: "Revolut card payments", amount: octSkin[k], source: "Revolut CSV (demo import)", area: "Skin", matched: true });
  tx({ date: d, kind: "Receipt", description: "Card settlement · hair and scalp", counterparty: "Revolut card payments", amount: octHair[k], source: "Revolut CSV (demo import)", area: "Hair & scalp", matched: true });
});

/* October costs: €6,300 in total. Supplier names are fictional. */
const OCT_COSTS: [string, string, string, number, CostCategory, boolean][] = [
  ["2026-10-01", "Clinic room rental · October", "Room landlord (fictional)", 1800, "Room rental", true],
  ["2026-10-03", "Consumables order", "Liffey Clinical Supplies (fictional)", 860, "Consumables", true],
  ["2026-10-14", "Consumables order", "Liffey Clinical Supplies (fictional)", 740, "Consumables", false],
  ["2026-10-24", "Skincare stock", "Northbank Skin Wholesale (fictional)", 800, "Consumables", true],
  ["2026-10-05", "Professional indemnity · monthly", "Indemnity insurer (fictional)", 350, "Insurance", true],
  ["2026-10-02", "Website plan", "Carrd", 20, "Software and communications", true],
  ["2026-10-09", "Mobile phone plan", "Mobile provider (fictional)", 45, "Software and communications", true],
  ["2026-10-12", "Calendar and email workspace", "Workspace subscription", 85, "Software and communications", false],
  ["2026-10-07", "Clinic linen and laundry", "Laundry service (fictional)", 240, "Other business expenses", true],
  ["2026-10-11", "Training course", "CPD provider (fictional)", 650, "Other business expenses", true],
  ["2026-10-18", "Printing · aftercare cards", "Print shop (fictional)", 190, "Other business expenses", false],
  ["2026-10-21", "Clinic supplies · general", "Retail purchase", 320, "Other business expenses", true],
  ["2026-10-28", "Parking and travel", "Various", 200, "Other business expenses", false],
];
for (const c of OCT_COSTS) tx({ date: c[0], kind: "Expense", description: c[1], counterparty: c[2], amount: c[3], source: "Revolut CSV (demo import)", category: c[4], matched: true, docOnFile: c[5] });

/* November: early receipts already matched, then the eight awaiting allocation. */
const NOV_MATCHED: [string, string, number][] = [
  ["2026-11-03", "PAT-012", 180], ["2026-11-03", "PAT-027", 80], ["2026-11-05", "PAT-048", 90], ["2026-11-05", "PAT-208", 60],
];
for (const m of NOV_MATCHED) {
  const appt = APPOINTMENTS.find((a) => a.patientId === m[1] && SLOT_BY_ID[a.slotId].date === m[0]);
  tx({ date: m[0], kind: "Receipt", description: "Card payment", counterparty: PATIENT_BY_ID[m[1]].name, amount: m[2], source: "Revolut CSV (demo import)",
    area: m[2] === 90 ? "Hair & scalp" : m[2] === 60 ? "Consultations" : "Skin", patientId: m[1], appointmentId: appt?.id, matched: true });
}

export const UNMATCHED_IDS: string[] = [];
const UNMATCHED: [string, string, number][] = [
  ["2026-11-06", "Bank transfer · ref KELLY N", 180],
  ["2026-11-06", "Card payment · reference missing", 180],
  ["2026-11-06", "Bank transfer · ref DEPOSIT", 250],
  ["2026-11-07", "Bank transfer · no reference", 150],
  ["2026-11-07", "Card payment · reference missing", 120],
  ["2026-11-08", "Bank transfer · ref SKIN", 160],
  ["2026-11-09", "Card payment · reference missing", 100],
  ["2026-11-09", "Bank transfer · no reference", 100],
];
for (const u of UNMATCHED) {
  tx({ date: u[0], kind: "Receipt", description: u[1], counterparty: "Unidentified payer", amount: u[2], source: "Revolut CSV (demo import)", matched: false });
  UNMATCHED_IDS.push(TRANSACTIONS[TRANSACTIONS.length - 1].id);
}
/* The Finance Agent's one confident proposal. */
{
  const t = TRANSACTIONS.find((x) => x.id === UNMATCHED_IDS[0])!;
  const niamhAppt = APPOINTMENTS.find((a) => a.patientId === "PAT-072" && SLOT_BY_ID[a.slotId].date === "2026-11-05");
  t.proposedPatientId = "PAT-072";
  t.proposedAppointmentId = niamhAppt?.id;
  t.proposedConfidence = "Reference KELLY N, €180 matches Niamh Kelly's microneedling appointment on Thu 5 Nov";
}
export const PROPOSED_MATCH_TX = UNMATCHED_IDS[0];

/* ── tasks, approvals, onboarding ───────────────────────────────────────── */
export type TaskStatus = "To do" | "In progress" | "Done";
export interface Task {
  id: string;
  title: string;
  owner: "Deborah" | "Booking Agent" | "Finance Agent" | "Inbox Assistant" | "Content Assistant" | "Patient Admin Agent" | "Ops Watchdog";
  due: string;
  priority: "High" | "Medium" | "Low";
  area: WorkArea;
  status: TaskStatus;
  related: { kind: "Patient" | "Appointment" | "Receipt" | "Post" | "Onboarding" | "Conversation" | "Document" | "Setting"; id: string; label: string };
  /** Tasks generated by a story thread close when that thread resolves. */
  linkedTo?: string;
}
export const TASKS: Task[] = [
  { id: "TSK-01", title: "Approve availability offer to Aoife Murphy", owner: "Deborah", due: "2026-11-10", priority: "High", area: "Administration", status: "To do", related: { kind: "Conversation", id: "CONV-01", label: "CONV-01 · Aoife Murphy" }, linkedTo: "CONV-01" },
  { id: "TSK-02", title: "Resend intake form to Sarah Byrne", owner: "Patient Admin Agent", due: "2026-11-10", priority: "High", area: "Administration", status: "To do", related: { kind: "Patient", id: "PAT-118", label: "PAT-118 · Sarah Byrne" }, linkedTo: "PREP-01" },
  { id: "TSK-03", title: "Review consent document for Orla Walsh", owner: "Deborah", due: "2026-11-11", priority: "High", area: "Clinical", status: "To do", related: { kind: "Patient", id: "PAT-093", label: "PAT-093 · Orla Walsh" }, linkedTo: "PREP-02" },
  { id: "TSK-04", title: "Get a contact number before the hair consultation", owner: "Patient Admin Agent", due: "2026-11-10", priority: "Medium", area: "Administration", status: "To do", related: { kind: "Patient", id: "PAT-226", label: "PAT-226" }, linkedTo: "PREP-03" },
  { id: "TSK-05", title: "Resend pre-appointment questionnaire", owner: "Patient Admin Agent", due: "2026-11-12", priority: "Medium", area: "Administration", status: "To do", related: { kind: "Patient", id: "PAT-061", label: "PAT-061" }, linkedTo: "PREP-04" },
  { id: "TSK-06", title: "Allocate eight received payments (€1,240)", owner: "Finance Agent", due: "2026-11-13", priority: "High", area: "Finance", status: "In progress", related: { kind: "Receipt", id: "TX-UNMATCHED", label: "Reconciliation queue" } },
  { id: "TSK-07", title: "Upload four missing October expense receipts", owner: "Deborah", due: "2026-11-20", priority: "Medium", area: "Finance", status: "To do", related: { kind: "Document", id: "DOC-ACC", label: "Accountant pack · October" } },
  { id: "TSK-08", title: "Approve five content drafts", owner: "Deborah", due: "2026-11-11", priority: "Medium", area: "Marketing", status: "To do", related: { kind: "Post", id: "POST-03", label: "Content library" } },
  { id: "TSK-09", title: "Reply personally to the clinical question", owner: "Deborah", due: "2026-11-10", priority: "High", area: "Clinical", status: "To do", related: { kind: "Conversation", id: "CONV-09", label: "CONV-09" } },
  { id: "TSK-10", title: "Confirm the .ie domain and website address", owner: "Deborah", due: "2026-11-27", priority: "Low", area: "Marketing", status: "To do", related: { kind: "Setting", id: "SET-ORG", label: "Settings · Organisation" } },
  { id: "TSK-11", title: "Confirm Revolut account type", owner: "Deborah", due: "2026-11-27", priority: "Low", area: "Finance", status: "To do", related: { kind: "Setting", id: "SET-SYS", label: "Settings · Systems" } },
  { id: "TSK-12", title: "Move Apple Notes into patient records (preview)", owner: "Deborah", due: "2026-12-04", priority: "Low", area: "Administration", status: "To do", related: { kind: "Setting", id: "SET-SYS", label: "Settings · Systems" } },
];

export interface OnboardingItem {
  id: string;
  title: string;
  detail: string;
  done: boolean;
}
export const ONBOARDING: OnboardingItem[] = [
  { id: "ONB-01", title: "Draft the role outline", detail: "Two days weekly, laser appointments only once confirmed.", done: true },
  { id: "ONB-02", title: "List the planned expansion services", detail: "Laser appointments, kept separate from today's catalogue.", done: true },
  { id: "ONB-03", title: "Prepare the capacity scenario", detail: "16 extra slots weekly, shown as a scenario only.", done: true },
  { id: "ONB-04", title: "Write booking rules for a second diary", detail: "Separate practitioner calendar, same rooms and breaks.", done: true },
  { id: "ONB-05", title: "Write the patient handover SOP", detail: "How a patient moves between practitioners.", done: true },
  { id: "ONB-06", title: "Create an inactive practitioner profile", detail: "Placeholder profile with no access granted.", done: true },
  { id: "ONB-07", title: "Confirm working days", detail: "Which two days the practitioner would work.", done: false },
  { id: "ONB-08", title: "Confirm room availability", detail: "Check treatment-room time against the shared premises.", done: false },
  { id: "ONB-09", title: "Review required practitioner documentation", detail: "Registration, insurance and training records to be reviewed by Deborah.", done: false },
  { id: "ONB-10", title: "Approve access scope", detail: "Own diary and own patients only. No finance access.", done: false },
];
export const EXPANSION = { slotsPerDay: 8, days: 2, addedSlots: 16 };

/* ── agents ─────────────────────────────────────────────────────────────── */
export type AgentId = "briefing" | "ops" | "booking" | "inbox" | "finance" | "content" | "admin";
export interface AgentDef {
  id: AgentId;
  name: string;
  responsibility: string;
  boundary: string;
  permittedData: string[];
  neverDoes: string[];
}
export const AGENTS: AgentDef[] = [
  { id: "briefing", name: "Briefing", responsibility: "Summarises today, money and outstanding work", boundary: "Read-only",
    permittedData: ["Appointments", "Receipts", "Tasks", "Conversations (counts only)"], neverDoes: ["Change any record", "Send anything"] },
  { id: "ops", name: "Ops Watchdog", responsibility: "Detects clashes, incomplete preparation and excess workload", boundary: "Proposes tasks",
    permittedData: ["Calendar", "Preparation checks", "Clinic hours"], neverDoes: ["Move appointments on its own", "Contact patients"] },
  { id: "booking", name: "Booking Agent", responsibility: "Suggests valid slots and waitlist matches", boundary: "Offers and changes need approval",
    permittedData: ["Calendar", "Waitlist", "Services and durations"], neverDoes: ["Double-book", "Book outside clinic hours", "Send an offer without approval"] },
  { id: "inbox", name: "Inbox Assistant", responsibility: "Drafts administrative replies in Deborah's voice", boundary: "Every reply reviewed before sending",
    permittedData: ["Conversations", "Response library", "Open slots"], neverDoes: ["Answer clinical questions", "Give treatment advice", "Send without approval"] },
  { id: "finance", name: "Finance Agent", responsibility: "Suggests payment matches and flags missing receipts", boundary: "Allocation needs approval",
    permittedData: ["Transactions", "Appointments (dates and prices)"], neverDoes: ["Move money", "Count a receipt twice", "File tax returns"] },
  { id: "content", name: "Content Assistant", responsibility: "Prepares captions and scheduling suggestions", boundary: "Publication needs approval",
    permittedData: ["Content library", "Planner"], neverDoes: ["Use patient records or photos", "Publish on its own"] },
  { id: "admin", name: "Patient Admin Agent", responsibility: "Tracks forms and administrative follow-ups", boundary: "No clinical decisions",
    permittedData: ["Intake form status", "Contact details", "Follow-up dates"], neverDoes: ["Assess suitability", "Read clinical notes for marketing"] },
];

export type RunApproval = "Not needed" | "Awaiting approval" | "Approved" | "Rejected";
export interface AgentRun {
  id: string;
  agent: AgentId;
  at: string;
  title: string;
  evidence: string[];
  proposed: string;
  approval: RunApproval;
  links: { label: string; page: string; tab?: string; id?: string }[];
  /** Approval state follows this story item. */
  follows?: string;
}
export const AGENT_RUNS: AgentRun[] = [
  { id: "RUN-01", agent: "briefing", at: "2026-11-10 08:00", title: "Morning briefing", approval: "Not needed",
    evidence: ["18 appointments today, 2 open slots", "8 unmatched receipts", "12 open conversations", "4 preparation checks"],
    proposed: "No action. Briefing posted to Home.", links: [{ label: "Home", page: "Home" }] },
  { id: "RUN-02", agent: "booking", at: "2026-11-10 07:45", title: "Matched today's open slots to the waitlist", approval: "Awaiting approval", follows: "CONV-01",
    evidence: ["SLOT-101 today 14:00, 30 min, consult room", "SLOT-102 today 16:00, 30 min", "Aoife Murphy (PAT-041) wants weekday afternoons"],
    proposed: "Offer SLOT-101 to Aoife Murphy. Draft prepared in Inbox.", links: [{ label: "Waitlist", page: "Bookings", tab: "waitlist" }, { label: "CONV-01", page: "Inbox", tab: "drafts", id: "CONV-01" }] },
  { id: "RUN-03", agent: "finance", at: "2026-11-10 07:30", title: "Reconciled the Revolut demo import", approval: "Awaiting approval", follows: PROPOSED_MATCH_TX,
    evidence: ["8 receipts without an allocation, €1,240", "Reference KELLY N matches PAT-072", "Niamh Kelly's 5 Nov appointment priced €180"],
    proposed: "Allocate €180 to Niamh Kelly. Seven receipts stay in the queue.", links: [{ label: "Transactions", page: "Finance", tab: "transactions" }] },
  { id: "RUN-04", agent: "inbox", at: "2026-11-10 07:20", title: "Drafted replies overnight", approval: "Awaiting approval",
    evidence: ["12 open conversations", "1 clinical question excluded", "2 personal messages left for Deborah"],
    proposed: "8 drafts ready for review.", links: [{ label: "Drafts", page: "Inbox", tab: "drafts" }] },
  { id: "RUN-05", agent: "admin", at: "2026-11-10 07:10", title: "Checked this week's preparation", approval: "Not needed",
    evidence: ["Sarah Byrne: intake incomplete", "Orla Walsh: consent document review", "PAT-226: no mobile number", "PAT-061: questionnaire not returned"],
    proposed: "4 preparation tasks created in Work.", links: [{ label: "Preparation", page: "Patients", tab: "preparation" }] },
  { id: "RUN-06", agent: "ops", at: "2026-11-10 07:00", title: "Workload check for the week", approval: "Not needed",
    evidence: ["54 of 60 slots booked", "No clashes", "All appointments inside 09:00 to 19:00"],
    proposed: "No action. Utilisation 90%.", links: [{ label: "Capacity", page: "Bookings", tab: "capacity" }] },
  { id: "RUN-07", agent: "content", at: "2026-11-09 20:00", title: "Prepared next week's posts", approval: "Awaiting approval",
    evidence: ["Planner gaps Wed to Mon", "Topics from Deborah's list"],
    proposed: "5 posts ready for review. Nothing is published without approval.", links: [{ label: "Content library", page: "Marketing", tab: "library" }] },
  { id: "RUN-08", agent: "inbox", at: "2026-11-10 01:16", title: "Routed a clinical question", approval: "Not needed",
    evidence: ["Message mentions new medication", "Sensitive-topic rule matched"],
    proposed: "Routed CONV-09 to Deborah. No draft written.", links: [{ label: "CONV-09", page: "Inbox", tab: "conversations", id: "CONV-09" }] },
  { id: "RUN-09", agent: "briefing", at: "2026-11-09 08:00", title: "Morning briefing", approval: "Not needed",
    evidence: ["No clinic today", "6 receipts imported"], proposed: "No action.", links: [] },
  { id: "RUN-10", agent: "ops", at: "2026-11-06 18:50", title: "End-of-day check", approval: "Approved",
    evidence: ["20 of 20 slots used", "One appointment ran 15 min over"], proposed: "Added a note to keep 5 min turnover after treatments. Deborah approved.", links: [{ label: "Capacity", page: "Bookings", tab: "capacity" }] },
];

/* ── documents ──────────────────────────────────────────────────────────── */
export interface Doc {
  id: string;
  title: string;
  kind: "Intake form" | "Consent document" | "Receipt" | "SOP" | "Export";
  patientId?: string;
  date: string;
  status: "On file" | "Incomplete" | "Review needed" | "Missing" | "Draft";
  note: string;
}
export const DOCUMENTS: Doc[] = [
  { id: "DOC-01", title: "Intake form · Sarah Byrne", kind: "Intake form", patientId: "PAT-118", date: "2026-11-08", status: "Incomplete", note: "Medical-history section not submitted. Placeholder only." },
  { id: "DOC-02", title: "Consent document reference · Orla Walsh", kind: "Consent document", patientId: "PAT-093", date: "2026-10-20", status: "Review needed", note: "Reference only. Contents are not shown in the demo." },
  { id: "DOC-03", title: "Intake form · Niamh Kelly", kind: "Intake form", patientId: "PAT-072", date: "2026-06-11", status: "On file", note: "Placeholder." },
  { id: "DOC-04", title: "Consent document reference · Niamh Kelly", kind: "Consent document", patientId: "PAT-072", date: "2026-06-11", status: "On file", note: "Reference only." },
  { id: "DOC-05", title: "Intake form · Aoife Murphy", kind: "Intake form", patientId: "PAT-041", date: "2026-11-04", status: "Draft", note: "Sent once a slot is confirmed." },
  { id: "DOC-06", title: "Pre-appointment questionnaire · PAT-061", kind: "Intake form", patientId: "PAT-061", date: "2026-11-06", status: "Missing", note: "Not returned yet." },
  { id: "DOC-07", title: "Receipt · Liffey Clinical Supplies, 3 Oct", kind: "Receipt", date: "2026-10-03", status: "On file", note: "€860" },
  { id: "DOC-08", title: "Receipt · Liffey Clinical Supplies, 14 Oct", kind: "Receipt", date: "2026-10-14", status: "Missing", note: "€740. Needed for the accountant pack." },
  { id: "DOC-09", title: "Receipt · Workspace subscription, 12 Oct", kind: "Receipt", date: "2026-10-12", status: "Missing", note: "€85" },
  { id: "DOC-10", title: "Receipt · Print shop, 18 Oct", kind: "Receipt", date: "2026-10-18", status: "Missing", note: "€190" },
  { id: "DOC-11", title: "Receipt · Parking and travel, October", kind: "Receipt", date: "2026-10-28", status: "Missing", note: "€200" },
  { id: "DOC-12", title: "SOP · Opening and closing the clinic", kind: "SOP", date: "2026-09-01", status: "On file", note: "Room set-up, turnover and lock-up." },
  { id: "DOC-13", title: "SOP · Patient handover between practitioners", kind: "SOP", date: "2026-11-02", status: "Draft", note: "Written for the planned second practitioner." },
  { id: "DOC-14", title: "SOP · Handling payments and receipts", kind: "SOP", date: "2026-10-15", status: "On file", note: "How Revolut payments are matched to visits." },
  { id: "DOC-15", title: "Accountant pack · October 2026", kind: "Export", date: "2026-11-10", status: "Draft", note: "Generated in the demo from Finance." },
];

/* ── registry: suppliers and resources ──────────────────────────────────── */
export const SUPPLIERS = [
  { id: "SUP-01", name: "Liffey Clinical Supplies (fictional)", supplies: "Consumables", terms: "Card on order" },
  { id: "SUP-02", name: "Northbank Skin Wholesale (fictional)", supplies: "Skincare stock", terms: "Card on order" },
  { id: "SUP-03", name: "Room landlord (fictional)", supplies: "Clinic room rental", terms: "Monthly, 1st" },
  { id: "SUP-04", name: "Indemnity insurer (fictional)", supplies: "Professional indemnity", terms: "Monthly" },
];

/* ── integrations (none are live) ───────────────────────────────────────── */
export type IntegrationState = "Simulated in demo" | "Manual import preview" | "Planned, not connected" | "Awaiting confirmation" | "Optional demo channel" | "Demo only";
export interface Integration {
  id: string;
  name: string;
  evidence: string;
  state: IntegrationState;
  presentation: string;
}
export const INTEGRATIONS: Integration[] = [
  { id: "INT-IG", name: "Instagram", evidence: "Current acquisition and messaging channel", state: "Simulated in demo", presentation: "Simulated inbox and content planning. Connection requirements not yet verified." },
  { id: "INT-GC", name: "Google Calendar", evidence: "Current appointment calendar", state: "Simulated in demo", presentation: "Simulated calendar import and sync preview." },
  { id: "INT-AN", name: "Apple Notes", evidence: "Current notes location", state: "Manual import preview", presentation: "Manual migration preview. No connector is claimed." },
  { id: "INT-RV", name: "Revolut", evidence: "Current payment tool; account type unknown", state: "Manual import preview", presentation: "Sample CSV import and payment matching." },
  { id: "INT-RB", name: "Revolut Business", evidence: "Discussed as a future option", state: "Planned, not connected", presentation: "Planned only." },
  { id: "INT-CR", name: "Carrd", evidence: "Existing one-page site", state: "Awaiting confirmation", presentation: "Website reference. URL awaiting confirmation." },
  { id: "INT-DM", name: ".ie domain", evidence: "Purchased; exact domain not supplied", state: "Awaiting confirmation", presentation: "Awaiting confirmation." },
  { id: "INT-WA", name: "WhatsApp", evidence: "Mentioned in the call", state: "Optional demo channel", presentation: "Business API setup unconfirmed." },
  { id: "INT-EM", name: "Email", evidence: "Possible administrative channel", state: "Demo only", presentation: "Provider unconfirmed." },
];

/* ── activity seed ──────────────────────────────────────────────────────── */
export type ActivityKind = "Imported" | "Agent proposal" | "Your action" | "System";
export interface ActivityEvent {
  id: string;
  at: string;
  kind: ActivityKind;
  actor: string;
  text: string;
  area: WorkArea | "Bookings";
  link?: { page: string; tab?: string; id?: string };
}
export const ACTIVITY_SEED: ActivityEvent[] = [
  { id: "ACT-01", at: "2026-11-10 08:00", kind: "Agent proposal", actor: "Briefing", text: "Morning briefing posted to Home.", area: "Administration", link: { page: "Home" } },
  { id: "ACT-02", at: "2026-11-10 07:45", kind: "Agent proposal", actor: "Booking Agent", text: "Booking Agent identified two available slots.", area: "Bookings", link: { page: "Bookings", tab: "waitlist" } },
  { id: "ACT-03", at: "2026-11-10 07:31", kind: "Agent proposal", actor: "Finance Agent", text: "Finance Agent proposed a match for €180.", area: "Finance", link: { page: "Finance", tab: "transactions" } },
  { id: "ACT-04", at: "2026-11-10 07:28", kind: "Imported", actor: "Demo import", text: "Demo import added eight Revolut receipts.", area: "Finance", link: { page: "Finance", tab: "transactions" } },
  { id: "ACT-05", at: "2026-11-10 07:20", kind: "Agent proposal", actor: "Inbox Assistant", text: "Eight message drafts prepared; three conversations left for Deborah.", area: "Administration", link: { page: "Inbox", tab: "drafts" } },
  { id: "ACT-06", at: "2026-11-10 07:10", kind: "Agent proposal", actor: "Patient Admin Agent", text: "Preparation check flagged an incomplete form.", area: "Administration", link: { page: "Patients", tab: "preparation" } },
  { id: "ACT-07", at: "2026-11-10 01:16", kind: "System", actor: "Inbox Assistant", text: "A clinical question was routed to Deborah with no draft.", area: "Clinical", link: { page: "Inbox", tab: "conversations", id: "CONV-09" } },
  { id: "ACT-08", at: "2026-11-09 20:00", kind: "Agent proposal", actor: "Content Assistant", text: "Five content drafts await approval.", area: "Marketing", link: { page: "Marketing", tab: "library" } },
  { id: "ACT-09", at: "2026-11-09 16:40", kind: "Your action", actor: "Deborah", text: "Deborah approved an appointment-response draft.", area: "Administration", link: { page: "Inbox", tab: "conversations" } },
  { id: "ACT-10", at: "2026-11-08 11:00", kind: "Your action", actor: "Deborah", text: "Practitioner onboarding reached 60%.", area: "Administration", link: { page: "Work", tab: "onboarding" } },
  { id: "ACT-11", at: "2026-11-07 09:00", kind: "Imported", actor: "Demo import", text: "Calendar import preview loaded this week's appointments.", area: "Bookings", link: { page: "Bookings", tab: "calendar" } },
  { id: "ACT-12", at: "2026-11-06 18:50", kind: "Agent proposal", actor: "Ops Watchdog", text: "Ops Watchdog suggested keeping 5 minutes' turnover after treatments.", area: "Clinical", link: { page: "Bookings", tab: "capacity" } },
];
