/* Deterministic Home chat answers. No model is called: each answer is built
   from the live demo records so it always agrees with the rest of Pulse. */

import { getState, go } from "./store";
import * as S from "./selectors";
import * as F from "./fixtures";
import { dayLabel, eur, relDay } from "./format";

export interface Answer {
  tool: string;
  effect: "read" | "write";
  text: string;
  cols?: string[];
  rows?: string[][];
  /** [label, primary, run]. Without run, the label is asked as a follow-up question. */
  actions?: [string, number, (() => void)?][];
  confirm?: boolean;
  confirmSummary?: string;
}

export const HOME_PROMPTS = [
  "What needs my attention today?",
  "Show payments that need matching.",
  "Which messages can I approve?",
  "Can I safely open more appointments?",
];

function attention(): Answer {
  const s = getState();
  const t = S.today(s), q = S.receiptQueue(s), ib = S.inboxCounts(s), prep = S.prepOutstanding(s), posts = S.postsAwaiting(s);
  const rows: string[][] = [
    ["Open slots today", String(t.open), "Bookings", t.open ? "Waitlist match ready" : "Full"],
    ["Receipts to match", String(q.count), "Finance", eur(q.total)],
    ["Message drafts", String(ib.drafts), "Inbox", ib.personal + " for you personally"],
    ["Preparation checks", String(prep.length), "Patients", prep.map((p) => p.patient.first).slice(0, 2).join(", ") || "None"],
    ["Content approvals", String(posts.length), "Marketing", posts.length ? "Next: " + posts[0].title : "None"],
  ];
  return {
    tool: "briefing.today", effect: "read", text: S.briefing(s),
    cols: ["Item", "Count", "Where", "Detail"], rows,
    actions: [
      ["Open the waitlist", 1, () => go("Bookings", "waitlist")],
      ["Review drafts", 0, () => go("Inbox", "drafts")],
      ["Match payments", 0, () => go("Finance", "transactions")],
    ],
  };
}

function payments(): Answer {
  const s = getState();
  const q = S.receiptQueue(s);
  if (!q.count) return { tool: "finance.reconcile", effect: "read", text: "Every received payment is matched. Nothing is waiting.", actions: [["Open Finance", 0, () => go("Finance", "overview")]] };
  const proposed = q.list.find((x) => x.proposedPatientId);
  const text = numCap(q.count) + " received payment" + (q.count === 1 ? "" : "s") + " totalling " + eur(q.total) + " still need" + (q.count === 1 ? "s" : "") + " matching. These are funds already received from the Revolut demo import, not unpaid invoices."
    + (proposed ? " The Finance Agent has one confident proposal: " + eur(proposed.amount) + " to " + S.patientOf(s, proposed.proposedPatientId!).name + ". Approving it records the allocation only; revenue and cash are not counted twice." : "");
  return {
    tool: "finance.reconcile", effect: "read", text,
    cols: ["Received", "Amount", "Reference", "Proposal"],
    rows: q.list.map((t) => [dayLabel(t.date), eur(t.amount), t.description.replace(/^.*· /, ""), t.proposedPatientId ? S.patientOf(s, t.proposedPatientId).name : "None yet"]),
    actions: [["Review the proposed match", 1, () => go("Finance", "transactions", proposed?.id)], ["Open all transactions", 0, () => go("Finance", "transactions")]],
  };
}

function messages(): Answer {
  const s = getState();
  const ib = S.inboxCounts(s), drafts = S.openDrafts(s);
  const text = (ib.drafts ? "You can approve " + numWord(ib.drafts) + " draft" + (ib.drafts === 1 ? "" : "s") + ". Each one is written in your voice and waits for your yes; approving marks it sent in demo, nothing leaves Pulse." : "No drafts are waiting.")
    + (ib.personal ? " " + numCap(ib.personal) + " conversation" + (ib.personal === 1 ? " is" : "s are") + " left for you personally, including a clinical question I have not drafted a reply to." : "")
    + (ib.awaiting ? " " + numCap(ib.awaiting) + " is waiting on the patient." : "");
  return {
    tool: "inbox.drafts", effect: "read", text,
    cols: ["Contact", "Channel", "Purpose", "Age"],
    rows: drafts.map((c) => [c.contactName, c.channel, c.purpose, c.age]),
    actions: [["Review drafts", 1, () => go("Inbox", "drafts")], ["Open conversations", 0, () => go("Inbox", "conversations")]],
  };
}

function capacity(): Answer {
  const s = getState();
  const w = S.week(s), wl = s.waitlist.filter((x) => x.status !== "Booked").length;
  const open = S.openSlots(s, F.THIS_WEEK);
  const text = "This week " + w.booked + " of " + w.capacity + " slots are booked (" + w.utilisation + "% slot utilisation), leaving " + w.open + " open: "
    + open.map((o) => relDay(o.date) + " " + o.start).join(", ") + ". " + numCap(wl) + " people are on the waitlist, so the open slots can be filled without opening more hours."
    + " Adding time beyond the configured 09:00 to 19:00 days would add to an already heavy workload; the safer route to more capacity is the planned second practitioner (scenario: 60 to 76 slots, only once working days and room availability are confirmed).";
  return {
    tool: "bookings.capacity", effect: "read", text,
    cols: ["Day", "Booked", "Open", "Of"],
    rows: F.THIS_WEEK.map((d) => { const c = S.capacityFor(s, [d]); return [relDay(d), String(c.booked), String(c.open), String(c.capacity)]; }),
    actions: [["Fill from the waitlist", 1, () => go("Bookings", "waitlist")], ["See the capacity scenario", 0, () => go("Bookings", "capacity")]],
  };
}

function clinical(): Answer {
  return {
    tool: "policy.escalate", effect: "read",
    text: "That is a clinical question, so I will not answer it. Clinical questions go to you personally, with no AI draft and no treatment recommendation. I can show you the conversation it came from.",
    actions: [["Open the conversation", 1, () => go("Inbox", "conversations", "CONV-09")]],
  };
}

function fallback(): Answer {
  return {
    tool: "pulse.search", effect: "read",
    text: "I can help with today's bookings, the waitlist, messages, payments, preparation checks and content. Everything I show comes from the fictional demo records, and anything that would leave Pulse waits for your approval.",
    actions: HOME_PROMPTS.map((p, i) => [p, i === 0 ? 1 : 0] as [string, number]),
  };
}

export function clinicAnswer(q: string): Answer {
  const s = q.toLowerCase();
  if (/medicat|safe to|side effect|pregnan|allerg|is it ok|should i (have|get)/.test(s) && !/appointment|slot/.test(s)) return clinical();
  if (/pay|receipt|match|revolut|money|reconcil/.test(s)) return payments();
  if (/message|draft|approve|inbox|reply|repl/.test(s)) return messages();
  if (/open more|capacity|safely|slots|availability|waitlist|book/.test(s)) return capacity();
  if (/attention|today|morning|brief|what needs|summary/.test(s)) return attention();
  return fallback();
}

const W = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const numWord = (n: number) => (n < W.length ? W[n] : String(n));
const numCap = (n: number) => { const w = numWord(n); return w.charAt(0).toUpperCase() + w.slice(1); };
