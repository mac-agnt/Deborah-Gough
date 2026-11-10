/* Work: tasks, approvals, the three core workflows and practitioner onboarding.
   Actions here call the same store actions the owning modules use, so an
   approval made here clears the same draft, post or receipt everywhere. */

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import * as F from "../fixtures";
import { SNAPSHOT, addDays, dateShort, relDay, eur, plural } from "../format";
import {
  useClinic, go, openPatient, toast, setTaskStatus, addTask, approveDraft, approveOffer, approvePost, matchReceipt, toggleOnboarding,
} from "../store";
import type { ClinicState } from "../store";
import {
  taskRows, approvals, inboxCounts, openSlots, week, prepOutstanding, receiptQueue, october, onboardingStats, apptsOn, patientOf,
  type Approval,
} from "../selectors";
import { Page, Grid, Panel, Badge, Btn, Table, Field, Note, Kv, Progress, DemoTag, Empty, type Tone } from "../ui";

export default function Work({ tab }: { tab: string; v?: unknown }) {
  const s = useClinic();
  if (tab === "approvals") return <Approvals s={s} />;
  if (tab === "workflows") return <Workflows s={s} />;
  if (tab === "onboarding") return <Onboarding s={s} />;
  return <Tasks s={s} />;
}

/* ── Tasks ──────────────────────────────────────────────────────────────── */

const STATUSES: F.TaskStatus[] = ["To do", "In progress", "Done"];
const PRIORITIES: F.Task["priority"][] = ["High", "Medium", "Low"];
const prioRank: Record<F.Task["priority"], number> = { High: 0, Medium: 1, Low: 2 };
const statusRank: Record<F.TaskStatus, number> = { "In progress": 0, "To do": 1, Done: 2 };
const prioTone: Record<F.Task["priority"], Tone> = { High: "bad", Medium: "warn", Low: "neutral" };

function openRelated(t: F.Task) {
  const r = t.related;
  switch (r.kind) {
    case "Patient": openPatient(r.id); break;
    case "Conversation": go("Inbox", "conversations", r.id); break;
    case "Post": go("Marketing", "library", r.id); break;
    case "Receipt": go("Finance", "transactions"); break;
    case "Setting": go("Settings", r.id === "SET-SYS" ? "systems" : "org"); break;
    case "Onboarding": go("Work", "onboarding"); break;
    case "Document": go("Records", "documents"); break;
    case "Appointment": go("Bookings", "calendar", r.id); break;
  }
}

function relatedLabel(s: ClinicState, t: F.Task): string {
  if (t.related.kind === "Patient") {
    const p = s.patients.find((x) => x.id === t.related.id);
    if (p) return p.name;
  }
  return t.related.label;
}

function Tasks({ s }: { s: ClinicState }) {
  const all = taskRows(s);
  const [status, setStatus] = useState<"open" | "all" | F.TaskStatus>("open");
  const [area, setArea] = useState<"all" | F.WorkArea>("all");
  const [owner, setOwner] = useState<string>("all");
  const owners = useMemo(() => Array.from(new Set(all.map((t) => t.owner))).sort(), [all]);

  const rows = all
    .filter((t) => (status === "all" ? true : status === "open" ? t.status !== "Done" : t.status === status))
    .filter((t) => area === "all" || t.area === area)
    .filter((t) => owner === "all" || t.owner === owner)
    .sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.due.localeCompare(b.due) || prioRank[a.priority] - prioRank[b.priority]);

  const open = all.filter((t) => t.status !== "Done");
  const dueToday = open.filter((t) => t.due <= SNAPSHOT.date).length;

  return (
    <Page title="Tasks" sub={plural(open.length, "open task") + ", " + dueToday + " due today or overdue. Tasks linked to a message, check or receipt close themselves when that work is done."}>
      <AddTask />
      <Panel title="All tasks" meta={rows.length + " shown"} flush
        actions={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <select className="c-select" aria-label="Filter by status" value={status} style={{ width: "auto", height: 30 }}
              onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="open">Open</option>
              <option value="all">All statuses</option>
              {STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select className="c-select" aria-label="Filter by work area" value={area} style={{ width: "auto", height: 30 }}
              onChange={(e) => setArea(e.target.value as typeof area)}>
              <option value="all">All work areas</option>
              {F.WORK_AREAS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select className="c-select" aria-label="Filter by owner" value={owner} style={{ width: "auto", height: 30 }}
              onChange={(e) => setOwner(e.target.value)}>
              <option value="all">All owners</option>
              {owners.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        }>
        <Table<F.Task>
          rows={rows}
          rowKey={(t) => t.id}
          pageSize={10}
          empty="No tasks match these filters."
          columns={[
            { key: "t", label: "Task", strong: true, render: (t) => <span style={{ textDecoration: t.status === "Done" ? "line-through" : undefined, color: t.status === "Done" ? "var(--dim)" : undefined }}>{t.title}</span> },
            { key: "o", label: "Owner", hideSm: true, render: (t) => t.owner },
            { key: "d", label: "Due", render: (t) => <span style={{ color: t.status !== "Done" && t.due <= SNAPSHOT.date ? "var(--warn)" : undefined, whiteSpace: "nowrap" }}>{relDay(t.due)}</span> },
            { key: "p", label: "Priority", hideSm: true, render: (t) => <Badge tone={prioTone[t.priority]}>{t.priority}</Badge> },
            { key: "a", label: "Work area", hideSm: true, render: (t) => t.area },
            { key: "s", label: "Status", render: (t) => (
              <select className="c-select" aria-label={"Status of " + t.title} value={t.status} style={{ height: 28, width: "auto", minWidth: 104 }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { setTaskStatus(t.id, e.target.value as F.TaskStatus); toast("Task marked " + e.target.value.toLowerCase() + "."); }}>
                {STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            ) },
            { key: "r", label: "Related record", hideSm: true, render: (t) => t.related.id
              ? <button type="button" className="c-btn ghost sm" onClick={() => openRelated(t)} title={"Open " + t.related.kind.toLowerCase()}>{t.related.kind}: {relatedLabel(s, t)}</button>
              : <span style={{ color: "var(--faint)" }}>None</span> },
          ]}
        />
      </Panel>
    </Page>
  );
}

function AddTask() {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<F.WorkArea>("Administration");
  const [due, setDue] = useState(addDays(SNAPSHOT.date, 2));
  const [priority, setPriority] = useState<F.Task["priority"]>("Medium");
  const [error, setError] = useState<string | undefined>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Give the task a short title."); return; }
    if (!due) { setError("Pick a due date."); return; }
    addTask({ title: title.trim(), owner: "Deborah", due, priority, area, related: { kind: "Document", id: "", label: "None" } });
    toast("Task added for Deborah, due " + dateShort(due) + ".");
    setTitle(""); setError(undefined);
  };

  return (
    <Panel title="Add a task" meta="Owner: Deborah">
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, alignItems: "end" }}>
        <div style={{ gridColumn: "span 2", minWidth: 0 }}>
          <Field label="Task" htmlFor="wk-title" error={error}>
            <input id="wk-title" className="c-input" value={title} placeholder="For example, order consumables for December" onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Work area" htmlFor="wk-area">
          <select id="wk-area" className="c-select" value={area} onChange={(e) => setArea(e.target.value as F.WorkArea)}>
            {F.WORK_AREAS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Due date" htmlFor="wk-due">
          <input id="wk-due" type="date" className="c-input" value={due} min={SNAPSHOT.date} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Priority" htmlFor="wk-prio">
          <select id="wk-prio" className="c-select" value={priority} onChange={(e) => setPriority(e.target.value as F.Task["priority"])}>
            {PRIORITIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <div><Btn type="submit" variant="primary">Add task</Btn></div>
      </form>
    </Panel>
  );
}

/* ── Approvals ──────────────────────────────────────────────────────────── */

const GROUPS: { type: Approval["type"]; hint: string; action: string }[] = [
  { type: "Message draft", hint: "Replies drafted by the Inbox Assistant", action: "Approve reply" },
  { type: "Availability offer", hint: "Open slots matched to the waitlist", action: "Approve offer" },
  { type: "Content post", hint: "Captions from the Content Assistant", action: "Approve and schedule" },
  { type: "Payment match", hint: "Receipts the Finance Agent matched", action: "Approve match" },
];

function approve(s: ClinicState, a: Approval) {
  if (a.type === "Message draft") { approveDraft(a.id); return; }
  if (a.type === "Availability offer") {
    if (a.id.startsWith("CONV-")) { approveDraft(a.id); return; }
    const r = approveOffer(a.id);
    toast(r.ok ? "Offer approved. Marked “Sent in demo”: no message was actually sent." : r.error);
    return;
  }
  if (a.type === "Content post") { approvePost(a.id); return; }
  const tx = s.transactions.find((t) => t.id === a.id);
  if (!tx || !tx.proposedPatientId) { toast("That proposal is no longer available."); return; }
  const r = matchReceipt(tx.id, tx.proposedPatientId, tx.proposedAppointmentId);
  toast(r.ok ? "Payment allocated to " + patientOf(s, tx.proposedPatientId).name + ". No money moved." : r.error);
}

function Approvals({ s }: { s: ClinicState }) {
  const list = approvals(s);
  return (
    <Page title="Approvals" sub={list.length
      ? plural(list.length, "item") + " waiting for you. Approving marks messages “Sent in demo” and posts “Scheduled in demo”; nothing leaves Pulse."
      : "Nothing is waiting for approval. Agents will queue new drafts, offers and matches here."}>
      <Grid cols="1fr 1fr">
        {GROUPS.map((g) => {
          const items = list.filter((a) => a.type === g.type);
          return (
            <Panel key={g.type} title={g.type} meta={g.hint} flush actions={<Badge tone={items.length ? "accent" : "neutral"}>{items.length}</Badge>}>
              {items.length ? (
                <div className="c-list">
                  {items.map((a) => (
                    <div key={a.id} className="c-li" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div className="grow" style={{ minWidth: 200 }}>
                        <div className="t">{a.title}</div>
                        {a.detail && <div className="s" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.detail}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flex: "none" }}>
                        <Btn size="sm" variant="primary" onClick={() => approve(s, a)}>{g.action}</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => go(a.link.page, a.link.tab, a.link.id)}>Open</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "4px 18px 16px", fontSize: 12.5, color: "var(--dim)" }}>Nothing waiting.</div>
              )}
            </Panel>
          );
        })}
      </Grid>
      <Note>Every agent proposal stops here or in its own module until you approve it. Clinical questions never get an AI draft; they go straight to you in the Inbox.</Note>
    </Page>
  );
}

/* ── Workflows ──────────────────────────────────────────────────────────── */

interface Step { name: string; who: string; agent?: F.AgentId; gate?: boolean; count: ReactNode; unit: string; link?: { label: string; page: string; tab: string } }

function Workflows({ s }: { s: ClinicState }) {
  const ib = inboxCounts(s);
  const w = week(s);
  const open = openSlots(s, F.THIS_WEEK).length;
  const waiting = s.waitlist.filter((x) => x.status !== "Booked" && x.status !== "Declined").length;
  const prepOut = prepOutstanding(s);
  const consent = prepOut.filter((p) => p.kind === "Consent document").length;
  const soon = prepOut.filter((p) => p.date <= addDays(SNAPSHOT.date, 2)).length;
  const weekAppts = apptsOn(s, F.THIS_WEEK);
  const outIds = new Set(prepOut.map((p) => p.patientId));
  const ready = weekAppts.filter((a) => !outIds.has(a.patientId)).length;
  const intakeOpen = Array.from(new Set(weekAppts.map((a) => a.patientId))).filter((id) => patientOf(s, id).intake !== "Complete").length;
  const q = receiptQueue(s);
  const proposed = q.list.filter((t) => t.proposedPatientId).length;
  const novImported = s.transactions.filter((t) => t.kind === "Receipt" && t.date >= "2026-11-01").length;
  const oct = october(s);

  const flows: { title: string; purpose: string; steps: Step[] }[] = [
    {
      title: "Enquiry to booking", purpose: "A message comes in, a valid slot is found, Deborah approves the reply.",
      steps: [
        { name: "Triage incoming messages", who: "Inbox Assistant", agent: "inbox", count: ib.open, unit: "open conversations", link: { label: "Inbox", page: "Inbox", tab: "conversations" } },
        { name: "Match a valid slot or waitlist place", who: "Booking Agent", agent: "booking", count: open + " / " + waiting, unit: "open slots / on waitlist", link: { label: "Waitlist", page: "Bookings", tab: "waitlist" } },
        { name: "Draft the reply in Deborah's voice", who: "Inbox Assistant", agent: "inbox", count: ib.drafts, unit: "drafts ready", link: { label: "Drafts", page: "Inbox", tab: "drafts" } },
        { name: "Approve the reply", who: "Deborah", gate: true, count: ib.sent, unit: "sent in demo so far", link: { label: "Approvals", page: "Work", tab: "approvals" } },
        { name: "Record the booking", who: "Booking Agent", agent: "booking", count: w.newPatients, unit: "new-patient bookings this week", link: { label: "Calendar", page: "Bookings", tab: "calendar" } },
      ],
    },
    {
      title: "Appointment preparation", purpose: "Forms, contact details and documents in order before each visit. Administrative only.",
      steps: [
        { name: "Confirm the appointment", who: "Booking Agent", agent: "booking", count: w.booked, unit: "appointments this week", link: { label: "Calendar", page: "Bookings", tab: "calendar" } },
        { name: "Track intake forms and details", who: "Patient Admin Agent", agent: "admin", count: prepOut.length, unit: "checks outstanding, " + intakeOpen + " intake forms open", link: { label: "Preparation", page: "Patients", tab: "preparation" } },
        { name: "Review consent documents", who: "Deborah", gate: true, count: consent, unit: "awaiting Deborah's review", link: { label: "Preparation", page: "Patients", tab: "preparation" } },
        { name: "Flag gaps before the day", who: "Ops Watchdog", agent: "ops", count: soon, unit: "due within two days", link: { label: "Agents", page: "Agents", tab: "runs" } },
        { name: "Ready for the visit", who: "Clinic", count: ready + " of " + weekAppts.length, unit: "appointments fully prepared" },
      ],
    },
    {
      title: "Payment reconciliation", purpose: "Revolut receipts matched to visits, with Deborah approving each allocation.",
      steps: [
        { name: "Import the Revolut statement", who: "Demo import", count: novImported, unit: "November receipts imported", link: { label: "Transactions", page: "Finance", tab: "transactions" } },
        { name: "Propose matches", who: "Finance Agent", agent: "finance", count: proposed, unit: "confident proposals", link: { label: "Transactions", page: "Finance", tab: "transactions" } },
        { name: "Approve each allocation", who: "Deborah", gate: true, count: q.count, unit: "in the queue, " + eur(q.total), link: { label: "Approvals", page: "Work", tab: "approvals" } },
        { name: "Flag missing expense receipts", who: "Finance Agent", agent: "finance", count: oct.missingDocs.length, unit: "October receipts missing", link: { label: "Revenue & costs", page: "Finance", tab: "revenue" } },
        { name: "Prepare the accountant pack", who: "Deborah", count: "Draft", unit: "October pack, export only", link: { label: "Accountant pack", page: "Finance", tab: "accountant" } },
      ],
    },
  ];

  return (
    <Page title="Workflows" sub="The three routines Pulse runs for the clinic. Counts are live from the records; marked steps wait for Deborah.">
      <Grid cols="1fr 1fr 1fr">
        {flows.map((f) => (
          <Panel key={f.title} title={f.title} flush>
            <p style={{ margin: "0 18px 10px", fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>{f.purpose}</p>
            <ol className="c-list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {f.steps.map((st, i) => {
                const paused = st.agent ? !!s.agentsPaused[st.agent] : false;
                return (
                  <li key={st.name} className="c-li" style={{ alignItems: "flex-start" }}>
                    <span aria-hidden="true" style={{ flex: "none", width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600,
                      background: st.gate ? "var(--warn-soft)" : "var(--accent-soft)", color: st.gate ? "var(--warn)" : "var(--accent)" }}>{i + 1}</span>
                    <div className="grow">
                      <div className="t">{st.name}</div>
                      <div className="s" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span>{st.who}</span>
                        {st.gate && <Badge tone="warn">Approval gate</Badge>}
                        {paused && <Badge tone="bad">Paused</Badge>}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                        <b style={{ fontSize: 15, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{st.count}</b>
                        <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{st.unit}</span>
                      </div>
                    </div>
                    {st.link && <Btn size="sm" variant="ghost" onClick={() => go(st.link!.page, st.link!.tab)}>{st.link.label}</Btn>}
                  </li>
                );
              })}
            </ol>
          </Panel>
        ))}
      </Grid>
      <Note>Paused agents stop proposing work but the steps stay visible. Change agent controls in <button type="button" className="c-btn ghost sm" onClick={() => go("Agents", "controls")}>Agents</button>.</Note>
    </Page>
  );
}

/* ── Onboarding ─────────────────────────────────────────────────────────── */

function ChecklistItem({ o, checked }: { o: F.OnboardingItem; checked: boolean }) {
  return (
    <label className="c-li" style={{ cursor: "pointer", alignItems: "flex-start" }}>
      <input type="checkbox" checked={checked} onChange={() => toggleOnboarding(o.id)} style={{ marginTop: 3, accentColor: "var(--accent)", width: 15, height: 15, flex: "none" }} />
      <div className="grow">
        <div className="t" style={{ color: checked ? "var(--dim)" : undefined }}>{o.title}</div>
        <div className="s">{o.detail}</div>
      </div>
      {checked ? <Badge tone="ok">Done</Badge> : <Badge tone="warn">Outstanding</Badge>}
    </label>
  );
}

function Onboarding({ s }: { s: ClinicState }) {
  const ob = onboardingStats(s);
  const w = week(s);
  const person = F.PEOPLE.find((p) => p.id === "PER-EB")!;
  const todo = F.ONBOARDING.filter((o) => !s.onboarding[o.id]);
  const done = F.ONBOARDING.filter((o) => s.onboarding[o.id]);

  return (
    <Page title="Practitioner onboarding" sub="Preparing for a second practitioner two days a week. Planned only: nobody has been employed and no access exists.">
      <Grid cols="1.5fr 1fr">
        <Panel title="Onboarding checklist" meta={ob.done + " of " + ob.total + " complete, " + ob.pct + "%"} flush>
          <div style={{ padding: "0 18px 12px" }}><Progress value={ob.done} max={ob.total} label="Onboarding progress" /></div>
          {todo.length ? (
            <>
              <div style={{ padding: "8px 18px 4px", fontSize: 11.5, color: "var(--dim)", borderTop: "1px solid var(--border)" }}>Outstanding, {todo.length}</div>
              <div className="c-list">{todo.map((o) => <ChecklistItem key={o.id} o={o} checked={!!s.onboarding[o.id]} />)}</div>
            </>
          ) : (
            <div style={{ padding: "0 18px 12px" }}><Empty title="Every item is complete">The capacity scenario is ready for Deborah's decision.</Empty></div>
          )}
          {done.length > 0 && (
            <>
              <div style={{ padding: "8px 18px 4px", fontSize: 11.5, color: "var(--dim)", borderTop: "1px solid var(--border)" }}>Done, {done.length}</div>
              <div className="c-list">{done.map((o) => <ChecklistItem key={o.id} o={o} checked={!!s.onboarding[o.id]} />)}</div>
            </>
          )}
        </Panel>

        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Panel title={person.name} meta={<DemoTag>Fictional placeholder</DemoTag>}
            actions={<Btn size="sm" variant="ghost" onClick={() => go("Settings", "people")}>People</Btn>}>
            <Kv items={[
              ["Role", person.role],
              ["State", <Badge tone="neutral">{person.state}, not employed</Badge>],
              ["Access", person.access],
              ["Note", person.note],
            ]} />
          </Panel>

          <Panel title="Capacity scenario" tint meta={<Badge tone="warn">Scenario only</Badge>}
            actions={<Btn size="sm" variant="primary" onClick={() => go("Bookings", "capacity")}>Open capacity</Btn>}>
            <Kv items={[
              ["Today", w.capacity + " slots a week"],
              ["Added", F.EXPANSION.addedSlots + " slots (" + F.EXPANSION.days + " days, " + F.EXPANSION.slotsPerDay + " a day)"],
              ["Scenario", w.capacity + " → " + (w.capacity + F.EXPANSION.addedSlots) + " slots a week"],
              ["Services", F.EXPANSION_SERVICES.map((e) => e.name).join(", ")],
            ]} />
            <div style={{ marginTop: 12 }}>
              <Note tone={todo.length ? "warn" : undefined}>
                {todo.length
                  ? "The extra slots open only after confirmation. Still to confirm: " + todo.map((o) => o.title.toLowerCase()).join("; ") + "."
                  : "Everything is confirmed in the checklist. The extra slots still open only when Deborah adds them in Bookings."}
              </Note>
            </div>
          </Panel>
        </div>
      </Grid>
    </Page>
  );
}
