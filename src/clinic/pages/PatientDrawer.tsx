/* Global patient record drawer. Opened from anywhere with openPatient(id).
   Every detail here is fictional. Patient data stays in this drawer and the
   Patients module; it is never shown in marketing views. */

import { useState, type ReactNode } from "react";
import * as F from "../fixtures";
import { dateShort, dayLabel, eur, relDay } from "../format";
import { go, openPatient, resolvePrep, toast, useClinic, useUi, type ClinicState, type ConvRow } from "../store";
import { lastVisit, nextAppt, patientAppts, prepRows, slotOf } from "../selectors";
import { Badge, Btn, DemoTag, Drawer, Empty, Kv, Note, Tabs, type Tone } from "../ui";

type TabId = "overview" | "appointments" | "documents" | "payments" | "messages";

const APPT_TONE: Record<F.ApptStatus, Tone> = { Booked: "accent", Confirmed: "ok", Attended: "neutral", "Did not attend": "warn", Cancelled: "outline" };
const DOC_TONE: Record<F.Doc["status"], Tone> = { "On file": "ok", Incomplete: "warn", "Review needed": "warn", Missing: "bad", Draft: "neutral" };

export default function PatientDrawer() {
  const ui = useUi();
  const s = useClinic();
  const id = ui.patientDrawer;
  const p = id ? s.patients.find((x) => x.id === id) : undefined;
  const close = () => openPatient(null);
  if (!id) return null;
  if (!p) {
    return (
      <Drawer open onClose={close} title="Patient not found">
        <Empty title="No record for this ID">{id} is not in the demo data.</Empty>
      </Drawer>
    );
  }
  return (
    <Drawer open onClose={close} width={560} title={p.name}
      sub={<span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{p.id} · {p.locality}<DemoTag>Fictional record</DemoTag></span>}
      footer={<Btn onClick={close}>Close</Btn>}>
      <Record key={p.id} s={s} p={p} />
    </Drawer>
  );
}

/** Navigate away from the drawer: close it first so the target page is visible. */
function leave(page: string, tab: string, focusId?: string) {
  openPatient(null);
  go(page, tab, focusId);
}

function Record({ s, p }: { s: ClinicState; p: F.Patient }) {
  const [tab, setTab] = useState<TabId>("overview");
  const appts = patientAppts(s, p.id);
  const docs = F.DOCUMENTS.filter((d) => d.patientId === p.id);
  const txs = s.transactions.filter((t) => t.patientId === p.id || (!t.matched && t.proposedPatientId === p.id));
  const convs = s.conversations.filter((c) => c.patientId === p.id);

  return (
    <>
      <Tabs<TabId> value={tab} onChange={setTab} items={[
        { id: "overview", label: "Overview" },
        { id: "appointments", label: "Appointments", count: appts.length },
        { id: "documents", label: "Documents", count: docs.length },
        { id: "payments", label: "Payments", count: txs.length },
        { id: "messages", label: "Messages", count: convs.length },
      ]} />
      {tab === "overview" && <Overview s={s} p={p} />}
      {tab === "appointments" && <Appointments appts={appts} />}
      {tab === "documents" && <Documents docs={docs} />}
      {tab === "payments" && <Payments s={s} txs={txs} patientId={p.id} />}
      {tab === "messages" && <Messages convs={convs} />}
    </>
  );
}

function apptWhen(a: F.Appointment): string {
  const sl = slotOf(a);
  return relDay(sl.date) + " " + dateShort(sl.date) + ", " + sl.start;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Overview({ s, p }: { s: ClinicState; p: F.Patient }) {
  const next = nextAppt(s, p.id);
  const last = lastVisit(s, p.id);
  const prep = prepRows(s).filter((r) => r.patientId === p.id);
  return (
    <>
      <Kv items={[
        ["Patient ID", p.id],
        ["Locality", <span key="l" style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>{p.locality}{p.targetArea && <Badge tone="outline">Target area</Badge>}</span>],
        ["Source", p.source],
        ["Contact preference", p.contactPref],
        ["Phone", p.phoneMasked + " (masked)"],
        ["Email", <span key="e" style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>{p.email}<DemoTag>Fictional address</DemoTag></span>],
        ["Registered", dateShort(p.registered)],
        ["Intake form", <Badge key="i" tone={p.intake === "Complete" ? "ok" : "warn"}>{p.intake}</Badge>],
        ["Consent document", <Badge key="c" tone={p.consentDocs === "Review needed" ? "warn" : p.consentDocs === "On file" ? "ok" : "neutral"}>{p.consentDocs}</Badge>],
        ["Next appointment", next ? apptWhen(next) + " · " + F.SERVICE_BY_ID[next.serviceId].name : "None booked"],
        ["Last visit", last ? dateShort(slotOf(last).date) + " · " + F.SERVICE_BY_ID[last.serviceId].name : "No visits yet"],
        ...(p.notes ? [["Admin note", p.notes] as [ReactNode, ReactNode]] : []),
      ]} />
      <Section title="Preparation checks">
        {prep.length === 0
          ? <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No preparation checks for this patient.</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prep.map((r) => (
                <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-faint)" }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--ink)", fontWeight: 500 }}>{r.kind}</span>
                      <Badge tone={r.resolved ? "ok" : "warn"}>{r.resolved ? "Resolved" : "Outstanding"}</Badge>
                    </div>
                    <div style={{ color: "var(--body)", marginTop: 3 }}>{r.issue}</div>
                    <div style={{ color: "var(--dim)", fontSize: 11.5, marginTop: 2 }}>Before {dayLabel(r.date)}</div>
                  </div>
                  {!r.resolved && <Btn size="sm" onClick={() => { resolvePrep(r.id); toast("Marked resolved: " + r.kind.toLowerCase() + "."); }}>Mark resolved</Btn>}
                </div>
              ))}
              <Note>Administrative checks only, not clinical assessments.</Note>
            </div>
          )}
      </Section>
    </>
  );
}

function Appointments({ appts }: { appts: F.Appointment[] }) {
  if (!appts.length) return <Empty title="No appointments">This patient has no appointments in the demo calendar.</Empty>;
  return (
    <div className="c-list" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
      {appts.map((a) => (
        <button key={a.id} type="button" className="c-li c-focus" onClick={() => leave("Bookings", "calendar", a.id)} title="Open in Bookings">
          <div className="grow">
            <div className="t">{F.SERVICE_BY_ID[a.serviceId].name}</div>
            <div className="s">{apptWhen(a)} · {a.id}{a.isNew ? " · first visit" : ""} · via {a.bookedVia}</div>
          </div>
          <Badge tone={APPT_TONE[a.status]}>{a.status}</Badge>
        </button>
      ))}
    </div>
  );
}

function Documents({ docs }: { docs: F.Doc[] }) {
  return (
    <>
      <Note>Documents are placeholders. The demo never stores or shows the contents of intake forms or consent documents, only their status.</Note>
      {docs.length === 0
        ? <Empty title="No documents">No placeholder documents for this patient.</Empty>
        : (
          <div className="c-list" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
            {docs.map((d) => (
              <div key={d.id} className="c-li">
                <div className="grow">
                  <div className="t">{d.kind} <span style={{ fontWeight: 400, color: "var(--dim)" }}>(placeholder)</span></div>
                  <div className="s">{d.id} · {dateShort(d.date)} · {d.note}</div>
                </div>
                <Badge tone={DOC_TONE[d.status]}>{d.status}</Badge>
              </div>
            ))}
          </div>
        )}
    </>
  );
}

function Payments({ s, txs, patientId }: { s: ClinicState; txs: F.Transaction[]; patientId: string }) {
  if (!txs.length) return <Empty title="No payments linked">No received payments are allocated or proposed for this patient.</Empty>;
  const appt = (id?: string) => (id ? s.appointments.find((a) => a.id === id) : undefined);
  return (
    <>
      <div className="c-list" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
        {txs.map((t) => {
          const proposed = !t.matched && t.proposedPatientId === patientId;
          const a = appt(proposed ? t.proposedAppointmentId : t.appointmentId);
          return (
            <button key={t.id} type="button" className="c-li c-focus" onClick={() => leave("Finance", "transactions", t.id)} title="Open in Finance">
              <div className="grow">
                <div className="t">{eur(t.amount)} · {t.description}</div>
                <div className="s">{dateShort(t.date)} · {t.id}{a ? " · " + F.SERVICE_BY_ID[a.serviceId].name + ", " + dayLabel(slotOf(a).date) : ""}</div>
                {proposed && t.proposedConfidence && <div className="s">Finance Agent: {t.proposedConfidence}</div>}
              </div>
              {proposed ? <Badge tone="warn">Proposed match</Badge> : <Badge tone="ok">Matched</Badge>}
            </button>
          );
        })}
      </div>
      <Note>A proposed match is only a suggestion. It is allocated once Deborah approves it in Finance. Amounts come from a demo Revolut import.</Note>
    </>
  );
}

const CONV_TONE: Record<ConvRow["state"], Tone> = { Open: "accent", "Sent in demo": "ok", Closed: "neutral" };

function Messages({ convs }: { convs: ConvRow[] }) {
  if (!convs.length) return <Empty title="No conversations">No messages linked to this patient in the demo inbox.</Empty>;
  return (
    <>
      <div className="c-list" style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
        {convs.map((c) => (
          <button key={c.id} type="button" className="c-li c-focus" onClick={() => leave("Inbox", "conversations", c.id)} title="Open in Inbox">
            <div className="grow">
              <div className="t">{c.purpose} <span style={{ fontWeight: 400, color: "var(--dim)" }}>· {c.channel}</span></div>
              <div className="s c-ellipsis">{c.lastMessage}</div>
            </div>
            <Badge tone={CONV_TONE[c.state]}>{c.state}</Badge>
          </button>
        ))}
      </div>
      <Note>Channels are simulated in the demo. Nothing here was received from or sent to a real account.</Note>
    </>
  );
}
