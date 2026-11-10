/* Patients module: directory, administrative preparation checks and
   follow-up reminders. All patients are fictional demo records. */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import * as F from "../fixtures";
import { dateShort, dayLabel, relDay } from "../format";
import { go, openPatient, reopenPrep, resolvePrep, setFollowup, takeFocus, toast, useClinic } from "../store";
import { apptsOn, balanceStatus, followUps, nextAppt, prepRows, slotOf, type FollowUp, type PrepRow } from "../selectors";
import { Avatar, Badge, Btn, Empty, Note, Page, Panel, Search, Table, type Column } from "../ui";

const linkBtn: CSSProperties = { background: "none", border: 0, padding: 0, font: "inherit", color: "var(--accent)", cursor: "pointer", textAlign: "left" };
const SOURCES: F.Source[] = ["Instagram", "Referral", "Website", "Walk-in"];
const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Patients({ tab }: { tab: string; v: unknown }) {
  // A deep link may carry a patient id: open their record on arrival.
  useState(() => {
    const f = takeFocus("Patients");
    if (f && f.startsWith("PAT-")) setTimeout(() => openPatient(f), 0);
    return f;
  });
  if (tab === "preparation") return <Preparation />;
  if (tab === "followups") return <FollowUps />;
  return <Directory />;
}

/* ── Directory ──────────────────────────────────────────────────────────── */

interface DirRow { p: F.Patient; next?: F.Appointment; balance: "Clear" | "Payment to match"; isNewThisWeek: boolean }

function Directory() {
  const s = useClinic();
  const [q, setQ] = useState("");
  const [source, setSource] = useState<"all" | F.Source>("all");
  const [area, setArea] = useState<"any" | "yes" | "no">("any");
  const [newOnly, setNewOnly] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const rows = useMemo<DirRow[]>(() => {
    const newIds = new Set(apptsOn(s, F.THIS_WEEK).filter((a) => a.isNew).map((a) => a.patientId));
    return s.patients.map((p) => ({ p, next: nextAppt(s, p.id), balance: balanceStatus(s, p.id), isNewThisWeek: newIds.has(p.id) }));
  }, [s]);

  const filtered = useMemo(() => {
    const needle = norm(q.trim());
    return rows.filter((r) => {
      if (needle && !norm([r.p.name, r.p.id, r.p.locality, r.p.email].join(" ")).includes(needle)) return false;
      if (source !== "all" && r.p.source !== source) return false;
      if (area === "yes" && !r.p.targetArea) return false;
      if (area === "no" && r.p.targetArea) return false;
      if (newOnly && !r.isNewThisWeek) return false;
      if (hasNext && !r.next) return false;
      return true;
    });
  }, [rows, q, source, area, newOnly, hasNext]);

  const counts = useMemo(() => ({
    total: rows.length,
    target: rows.filter((r) => r.p.targetArea).length,
    newWeek: rows.filter((r) => r.isNewThisWeek).length,
    withNext: rows.filter((r) => r.next).length,
    toMatch: rows.filter((r) => r.balance === "Payment to match").length,
  }), [rows]);

  const anyFilter = !!q || source !== "all" || area !== "any" || newOnly || hasNext;
  const clear = () => { setQ(""); setSource("all"); setArea("any"); setNewOnly(false); setHasNext(false); };

  const columns: Column<DirRow>[] = [
    { key: "patient", label: "Patient", render: (r) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Avatar name={r.p.name} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "var(--ink)", fontWeight: 500 }}>{r.p.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{r.p.id}{r.isNewThisWeek ? " · new this week" : ""}</div>
        </div>
      </div>
    ) },
    { key: "next", label: "Next appointment", render: (r) => {
      if (!r.next) return <span style={{ color: "var(--faint)" }}>None booked</span>;
      const sl = slotOf(r.next);
      return (
        <div>
          <div style={{ color: "var(--ink)" }}>{relDay(sl.date)}, {sl.start}</div>
          <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{dateShort(sl.date)} · {F.SERVICE_BY_ID[r.next.serviceId].name}</div>
        </div>
      );
    } },
    { key: "source", label: "Source", hideSm: true, render: (r) => r.p.source },
    { key: "locality", label: "Locality", hideSm: true, render: (r) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {r.p.locality}
        {r.p.targetArea && <Badge tone="outline" title="One of the five target areas around Milltown">Target area</Badge>}
      </span>
    ) },
    { key: "balance", label: "Balance", render: (r) => r.balance === "Clear" ? <Badge tone="ok">Clear</Badge> : <Badge tone="warn">Payment to match</Badge> },
  ];

  const sel: CSSProperties = { width: "auto", minWidth: 140 };
  return (
    <Page title="Patient directory"
      sub={counts.total + " fictional patient records. " + counts.target + " live in the target areas, " + counts.newWeek + " are new this week, " + counts.withNext + " have an appointment booked and " + counts.toMatch + " have a payment waiting to be matched."}>
      <Panel flush
        title={anyFilter ? "Showing " + filtered.length + " of " + counts.total : "All patients"}
        meta="Select a row to open the record"
        actions={anyFilter ? <Btn size="sm" variant="ghost" onClick={clear}>Clear filters</Btn> : undefined}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "0 18px 12px" }}>
          <Search value={q} onChange={setQ} placeholder="Search name, ID, locality or email" label="Search patients" />
          <select className="c-select" style={sel} value={source} onChange={(e) => setSource(e.target.value as "all" | F.Source)} aria-label="Filter by source">
            <option value="all">Any source</option>
            {SOURCES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select className="c-select" style={sel} value={area} onChange={(e) => setArea(e.target.value as "any" | "yes" | "no")} aria-label="Filter by target area">
            <option value="any">Any locality</option>
            <option value="yes">Target areas only</option>
            <option value="no">Outside target areas</option>
          </select>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--body)", cursor: "pointer" }}>
            <input type="checkbox" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} /> New this week
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--body)", cursor: "pointer" }}>
            <input type="checkbox" checked={hasNext} onChange={(e) => setHasNext(e.target.checked)} /> Has next appointment
          </label>
        </div>
        <Table key={[q, source, area, newOnly, hasNext].join("|")} columns={columns} rows={filtered} rowKey={(r) => r.p.id}
          onRow={(r) => openPatient(r.p.id)} pageSize={15}
          empty={<Empty title="No patients match">Try a different search or clear the filters.<div style={{ marginTop: 10 }}><Btn size="sm" onClick={clear}>Clear filters</Btn></div></Empty>} />
      </Panel>
    </Page>
  );
}

/* ── Preparation ────────────────────────────────────────────────────────── */

function apptLine(r: PrepRow): { when: string; service: string } | null {
  if (!r.appointment) return null;
  const sl = slotOf(r.appointment);
  return { when: relDay(sl.date) + " " + dateShort(sl.date) + ", " + sl.start, service: F.SERVICE_BY_ID[r.appointment.serviceId].name };
}

function Preparation() {
  const s = useClinic();
  const rows = prepRows(s);
  const open = rows.filter((r) => !r.resolved);
  const done = rows.filter((r) => r.resolved);
  const [showDone, setShowDone] = useState(false);

  return (
    <Page title="Preparation checks"
      sub={open.length + " of " + rows.length + " checks outstanding before upcoming appointments."}>
      <Note>These are administrative checks only: forms, documents and contact details. They are not clinical assessments, and Pulse makes no clinical judgement about any patient.</Note>
      <Panel flush title="Outstanding" meta={open.length ? String(open.length) : "None"}>
        {open.length === 0
          ? <Empty title="Every upcoming appointment is prepared">Resolved checks are listed below if you need to reopen one.</Empty>
          : (
            <div className="c-list">
              {open.map((r) => {
                const a = apptLine(r);
                return (
                  <div key={r.id} className="c-li" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                    <Avatar name={r.patient.name} />
                    <div className="grow" style={{ minWidth: 220 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button type="button" className="t c-focus" style={{ ...linkBtn, color: "var(--ink)", fontWeight: 500 }} onClick={() => openPatient(r.patient.id)}>{r.patient.name}</button>
                        <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{r.patient.id}</span>
                        <Badge tone="warn">{r.kind}</Badge>
                      </div>
                      <div style={{ marginTop: 4, color: "var(--body)" }}>{r.issue}</div>
                      <div className="s">Suggested step: {r.action}</div>
                      <div className="s">
                        {a ? <>Appointment: {a.when} · {a.service}</> : <>No matching appointment on {dayLabel(r.date)}</>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Btn size="sm" variant="primary" onClick={() => { resolvePrep(r.id); toast("Marked resolved: " + r.kind.toLowerCase() + " for " + r.patient.name + "."); }}>Mark resolved</Btn>
                      <Btn size="sm" onClick={() => openPatient(r.patient.id)}>Open patient</Btn>
                      {r.appointment && <Btn size="sm" variant="ghost" onClick={() => go("Bookings", "calendar", r.appointment!.id)}>Open appointment</Btn>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </Panel>
      {done.length > 0 && (
        <Panel flush title="Resolved" meta={String(done.length)}
          actions={<Btn size="sm" variant="ghost" onClick={() => setShowDone((x) => !x)}>{showDone ? "Hide" : "Show"}</Btn>}>
          {showDone && (
            <div className="c-list">
              {done.map((r) => {
                const a = apptLine(r);
                return (
                  <div key={r.id} className="c-li" style={{ flexWrap: "wrap" }}>
                    <div className="grow" style={{ minWidth: 200 }}>
                      <div className="t">{r.patient.name} <span style={{ fontWeight: 400, color: "var(--dim)", fontSize: 11.5 }}>{r.patient.id}</span></div>
                      <div className="s">{r.kind}{a ? " · " + a.when : ""}</div>
                    </div>
                    <Badge tone="ok">Resolved</Badge>
                    <Btn size="sm" variant="ghost" onClick={() => { reopenPrep(r.id); toast("Check reopened for " + r.patient.name + "."); }}>Reopen</Btn>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}
    </Page>
  );
}

/* ── Follow-ups ─────────────────────────────────────────────────────────── */

function FollowUps() {
  const s = useClinic();
  const rows = followUps(s);
  const [filter, setFilter] = useState<"all" | FollowUp["status"]>("all");
  useEffect(() => { if (filter !== "all" && !rows.some((r) => r.status === filter)) setFilter("all"); }, [rows, filter]);
  const by = (st: FollowUp["status"]) => rows.filter((r) => r.status === st).length;
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const nameOf = (id: string) => s.patients.find((p) => p.id === id)?.name || id;
  const label = (r: FollowUp) => nameOf(r.patientId) + ", " + r.service.toLowerCase();

  const columns: Column<FollowUp>[] = [
    { key: "patient", label: "Patient", render: (r) => (
      <div>
        <button type="button" className="c-focus" style={{ ...linkBtn, color: "var(--ink)", fontWeight: 500 }} onClick={() => openPatient(r.patientId)}>{nameOf(r.patientId)}</button>
        <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{r.patientId}</div>
      </div>
    ) },
    { key: "service", label: "Service attended", hideSm: true, render: (r) => r.service },
    { key: "attended", label: "Attended", hideSm: true, render: (r) => dayLabel(r.attended) },
    { key: "due", label: "Reminder due", render: (r) => <span title={r.reason}>{dayLabel(r.due)}<div style={{ fontSize: 11.5, color: "var(--dim)" }}>{dateShort(r.due)}</div></span> },
    { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Reviewed" ? "ok" : r.status === "Skipped" ? "neutral" : "accent"}>{r.status}</Badge> },
    { key: "actions", label: "", render: (r) => (
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {r.status === "Scheduled" ? (
          <>
            <Btn size="sm" onClick={() => setFollowup(r.id, "Reviewed", label(r))}>Mark reviewed</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setFollowup(r.id, "Skipped", label(r))}>Skip</Btn>
          </>
        ) : (
          <Btn size="sm" variant="ghost" onClick={() => setFollowup(r.id, "Scheduled", label(r))}>Undo</Btn>
        )}
      </div>
    ) },
  ];

  const chip = (id: "all" | FollowUp["status"], text: string, n: number) => (
    <button key={id} type="button" role="tab" aria-selected={filter === id} className="c-tab" onClick={() => setFilter(id)}>{text}<span className="cnt">{n}</span></button>
  );

  return (
    <Page title="Follow-up reminders"
      sub={rows.length + " reminders from last week's treatments: " + by("Scheduled") + " scheduled, " + by("Reviewed") + " reviewed, " + by("Skipped") + " skipped."}>
      <Note>These are administrative reminders for Deborah to review. Each one suggests offering a follow-up review a set number of days after a visit. Nothing is sent automatically, and marking a reminder reviewed only records that Deborah looked at it.</Note>
      <Panel flush title="Reminders" actions={<div className="c-tabs" role="tablist">{chip("all", "All", rows.length)}{chip("Scheduled", "Scheduled", by("Scheduled"))}{chip("Reviewed", "Reviewed", by("Reviewed"))}{chip("Skipped", "Skipped", by("Skipped"))}</div>}>
        <Table columns={columns} rows={shown} rowKey={(r) => r.id} pageSize={15}
          empty={<Empty title="No follow-up reminders">Reminders appear after treatments are marked attended.</Empty>} />
      </Panel>
    </Page>
  );
}
