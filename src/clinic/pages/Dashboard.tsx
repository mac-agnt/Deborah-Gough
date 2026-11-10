/* Dashboard: three different reads of the same records.
   Clinic: this week's capacity, mix, preparation and workload.
   Patient journey: enquiry to follow-up for this week's new patients.
   Growth: local share, repeat visits and the practitioner capacity scenario.
   Every figure is derived from the store, so it moves when Deborah acts. */

import type { ReactNode } from "react";
import * as F from "../fixtures";
import { SNAPSHOT, dayLabel, relDay, toMin, plural } from "../format";
import { useClinic, go, openPatient } from "../store";
import type { ClinicState } from "../store";
import {
  apptsOn, capacityFor, week, prepRows, localShare, followUps, onboardingStats, slotOf, patientOf, serviceOf,
} from "../selectors";
import { Page, Grid, Panel, Badge, Btn, Table, Note, BarList, Columns, Progress, DemoTag, Kv } from "../ui";

export default function Dashboard({ tab }: { tab: string; v?: unknown }) {
  const s = useClinic();
  if (tab === "journey") return <Journey s={s} />;
  if (tab === "growth") return <Growth s={s} />;
  return <ClinicTab s={s} />;
}

/* ── shared bits ────────────────────────────────────────────────────────── */

function Figure({ value, label, note, tone }: { value: ReactNode; label: ReactNode; note?: ReactNode; tone?: "ok" | "warn" | "accent" }) {
  const colour = tone ? "var(--" + tone + ")" : "var(--ink)";
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.4px", color: colour, fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: 2 }}>{value}</div>
      {note && <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2, lineHeight: 1.35 }}>{note}</div>}
    </div>
  );
}

const pctOf = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const weekRange = dayLabel(F.THIS_WEEK[0]) + " to " + dayLabel(F.THIS_WEEK[F.THIS_WEEK.length - 1]);

/** Configured bookable minutes in one clinic day: opening hours less breaks. */
function configuredMinutes(): number {
  const breaks = F.HOURS.breaks.reduce((n, b) => n + (toMin(b.end) - toMin(b.start)), 0);
  return toMin(F.HOURS.close) - toMin(F.HOURS.open) - breaks;
}

/** Patients with an appointment this week whose preparation checks are all resolved (or who have none). */
function prepState(s: ClinicState) {
  const rows = prepRows(s).filter((p) => F.THIS_WEEK.includes(p.date));
  const outstandingBy: Record<string, number> = {};
  for (const r of rows) if (!r.resolved) outstandingBy[r.patientId] = (outstandingBy[r.patientId] || 0) + 1;
  return { rows, outstandingBy };
}

/* ── Clinic ─────────────────────────────────────────────────────────────── */

interface DayRow { key: string; label: string; total?: boolean; capacity: number; booked: number; open: number; utilisation: number; newPatients: number }

function ClinicTab({ s }: { s: ClinicState }) {
  const w = week(s);
  const days: DayRow[] = F.THIS_WEEK.map((d) => ({ key: d, label: relDay(d) === "Today" ? "Today, " + dayLabel(d) : dayLabel(d), ...capacityFor(s, [d]) }));
  const rows: DayRow[] = [...days, { key: "week", label: "This week", total: true, ...w }];

  const appts = apptsOn(s, F.THIS_WEEK);
  const mix = F.SERVICES.map((sv) => ({ label: sv.name, value: appts.filter((a) => a.serviceId === sv.id).length }))
    .filter((m) => m.value > 0).sort((a, b) => b.value - a.value);

  const prep = prepRows(s).filter((p) => F.THIS_WEEK.includes(p.date));
  const prepDone = prep.filter((p) => p.resolved).length;
  const weekPatients = Array.from(new Set(appts.map((a) => a.patientId))).map((id) => patientOf(s, id));
  const intakeDone = weekPatients.filter((p) => p.intake === "Complete").length;
  const outstanding = prep.filter((p) => !p.resolved);

  const cfg = configuredMinutes();
  const load = F.THIS_WEEK.map((d) => {
    const list = apptsOn(s, [d]);
    const minutes = list.reduce((n, a) => n + serviceOf(a).duration + serviceOf(a).turnover, 0);
    return { date: d, count: list.length, minutes };
  });

  return (
    <Page title="This week at the clinic" sub={weekRange + ". Three clinic days, figures update as you book, prepare and approve."}>
      <Grid cols="1.35fr 1fr">
        <Panel title="Capacity by clinic day" meta="Booked against open slots" flush
          actions={<Btn size="sm" onClick={() => go("Bookings", "calendar")}>Open calendar</Btn>}>
          <Table<DayRow>
            rows={rows}
            rowKey={(r) => r.key}
            columns={[
              { key: "d", label: "Day", strong: true, render: (r) => r.total ? <b>{r.label}</b> : r.label },
              { key: "c", label: "Slots", num: true, hideSm: true, render: (r) => r.capacity },
              { key: "b", label: "Booked", num: true, render: (r) => r.booked },
              { key: "o", label: "Open", num: true, render: (r) => r.open ? <Badge tone="accent">{r.open}</Badge> : <span style={{ color: "var(--dim)" }}>0</span> },
              { key: "u", label: "Utilisation", width: "28%", render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 50 }}><Progress value={r.booked} max={r.capacity} label={"Utilisation " + r.label} /></div>
                  <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 12, color: "var(--ink)", minWidth: 34, textAlign: "right" }}>{r.utilisation}%</span>
                </div>
              ) },
              { key: "n", label: "New patients", num: true, hideSm: true, render: (r) => r.newPatients },
            ]}
          />
        </Panel>

        <Panel title="Appointment mix" meta={plural(appts.length, "appointment") + " this week"}
          actions={<Btn size="sm" variant="ghost" onClick={() => go("Bookings", "overview")}>Bookings</Btn>}>
          <BarList items={mix} />
          <div style={{ display: "flex", gap: 22, marginTop: 14, flexWrap: "wrap" }}>
            <Figure label="New patients" value={w.newPatients} note={pctOf(w.newPatients, w.booked) + "% of bookings"} />
            <Figure label="Returning" value={w.returning} note={pctOf(w.returning, w.booked) + "% of bookings"} />
          </div>
        </Panel>
      </Grid>

      <Grid cols="1fr 1.35fr">
        <Panel title="Preparation" meta="Administrative checks only"
          actions={<Btn size="sm" onClick={() => go("Patients", "preparation")}>Open preparation</Btn>}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ color: "var(--body)" }}>Preparation checks resolved</span>
                <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{prepDone} of {prep.length}</b>
              </div>
              <Progress value={prepDone} max={prep.length} label="Preparation checks resolved" />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ color: "var(--body)" }}>Intake forms complete, this week's patients</span>
                <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{intakeDone} of {weekPatients.length}</b>
              </div>
              <Progress value={intakeDone} max={weekPatients.length} label="Intake forms complete" />
            </div>
          </div>
          <div style={{ marginTop: 12, marginLeft: -18, marginRight: -18, marginBottom: -16, borderTop: "1px solid var(--border)" }}>
            {outstanding.length ? (
              <div className="c-list">
                {outstanding.map((p) => (
                  <button key={p.id} type="button" className="c-li" onClick={() => openPatient(p.patientId)}>
                    <div className="grow">
                      <div className="t c-ellipsis">{p.patient.name}</div>
                      <div className="s c-ellipsis">{p.kind}: {p.issue}</div>
                    </div>
                    <Badge tone="warn">{relDay(p.date)}</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="c-li"><span className="grow">Every check for this week is resolved.</span><Badge tone="ok">Ready</Badge></div>
            )}
          </div>
        </Panel>

        <Panel title="Workload" meta={"Configured hours " + F.HOURS.open + " to " + F.HOURS.close + ", " + F.HOURS.days.join(", ")}>
          <Grid cols="1fr 1.25fr" style={{ alignItems: "end" }}>
            <Columns items={load.map((l) => ({ label: relDay(l.date) === "Today" ? "Today" : dayLabel(l.date).slice(0, 6), value: l.count }))} height={140} />
            <div className="c-scroll-x">
              <table className="c-table">
                <thead><tr><th>Day</th><th className="num">Booked min</th><th className="num">Configured</th><th className="num">Share</th></tr></thead>
                <tbody>
                  {load.map((l) => (
                    <tr key={l.date}>
                      <td>{dayLabel(l.date)}</td>
                      <td className="num">{l.minutes}</td>
                      <td className="num">{cfg}</td>
                      <td className="num">{pctOf(l.minutes, cfg)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Grid>
          <div style={{ marginTop: 12 }}>
            <Note>Booked minutes include room turnover. Deborah has told us her real days run much longer than these configured hours; the demo schedules only to the configured hours and does not plan around the longer days.</Note>
          </div>
        </Panel>
      </Grid>
    </Page>
  );
}

/* ── Patient journey ────────────────────────────────────────────────────── */

interface NewRow { appt: F.Appointment; patient: F.Patient; outstanding: number }

function Journey({ s }: { s: ClinicState }) {
  const w = week(s);
  const { outstandingBy } = prepState(s);
  const newAppts = apptsOn(s, F.THIS_WEEK).filter((a) => a.isNew);
  const rows: NewRow[] = newAppts.map((a) => ({ appt: a, patient: patientOf(s, a.patientId), outstanding: outstandingBy[a.patientId] || 0 }));
  const prepared = rows.filter((r) => r.outstanding === 0).length;

  const last = apptsOn(s, F.LAST_WEEK);
  const attended = last.filter((a) => a.status === "Attended").length;
  const dna = last.filter((a) => a.status === "Did not attend").length;

  const fu = followUps(s);
  const fuScheduled = fu.filter((f) => f.status === "Scheduled").length;
  const fuReviewed = fu.filter((f) => f.status === "Reviewed").length;

  const stages: { label: string; value: ReactNode; note: ReactNode; tag?: string; go: () => void }[] = [
    { label: "Enquiries", value: F.FUNNEL_EVENTS.enquiries, note: "Instagram, WhatsApp and email", tag: "Attributed, fictional", go: () => go("Inbox", "conversations") },
    { label: "Booking-link opens", value: F.FUNNEL_EVENTS.bookingLinkOpens, note: pctOf(F.FUNNEL_EVENTS.bookingLinkOpens, F.FUNNEL_EVENTS.enquiries) + "% of enquiries", tag: "Attributed, fictional", go: () => go("Bookings", "online") },
    { label: "New-patient bookings", value: w.newPatients, note: pctOf(w.newPatients, F.FUNNEL_EVENTS.bookingLinkOpens) + "% of link opens", go: () => go("Bookings", "calendar") },
    { label: "Preparation complete", value: prepared + " of " + w.newPatients, note: plural(w.newPatients - prepared, "patient") + " with checks outstanding", go: () => go("Patients", "preparation") },
    { label: "Attendance", value: attended + " of " + last.length, note: "Last week, " + dna + " did not attend", go: () => go("Bookings", "calendar") },
    { label: "Follow-up reminders", value: fu.length, note: fuScheduled + " scheduled, " + fuReviewed + " reviewed", go: () => go("Patients", "followups") },
  ];

  const stageOf = (r: NewRow): { label: string; tone: "ok" | "warn" | "neutral" | "bad" } => {
    if (r.appt.status === "Attended") return { label: "Attended", tone: "ok" };
    if (r.appt.status === "Did not attend") return { label: "Did not attend", tone: "bad" };
    if (r.outstanding) return { label: "Preparing", tone: "warn" };
    return { label: "Ready for visit", tone: "ok" };
  };

  const sources: Record<string, number> = {};
  for (const r of rows) sources[r.patient.source] = (sources[r.patient.source] || 0) + 1;

  return (
    <Page title="Patient journey" sub={"From first enquiry to follow-up, for " + weekRange + ". Attendance uses last week, because this week's visits have not happened yet."}>
      <Panel title="This week's journey" meta="Select a stage to open where the work happens" actions={<DemoTag>Enquiry figures are fictional</DemoTag>}>
        <div className="c-scroll-x">
          <div style={{ display: "flex", alignItems: "stretch", gap: 6, minWidth: 900, paddingBottom: 2 }}>
            {stages.map((st, i) => (
              <div key={st.label} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                <button type="button" className="c-focus" onClick={st.go}
                  style={{ flex: 1, minWidth: 0, height: "100%", textAlign: "left", cursor: "pointer", font: "inherit", padding: "11px 12px", borderRadius: 12,
                    border: "1px solid var(--border)", background: i < 2 ? "var(--surface-2)" : "var(--accent-faint)", color: "var(--body)" }}>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums", marginTop: 3, letterSpacing: "-.4px" }}>{st.value}</div>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3, lineHeight: 1.35 }}>{st.note}</div>
                  {st.tag && <div style={{ marginTop: 6 }}><DemoTag>{st.tag}</DemoTag></div>}
                </button>
                {i < stages.length - 1 && <span aria-hidden="true" style={{ color: "var(--faint)", fontSize: 14 }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Grid cols="1.7fr 1fr">
        <Panel title="Where each new patient is" meta={plural(rows.length, "new patient") + " booked this week"} flush>
          <Table<NewRow>
            rows={rows}
            rowKey={(r) => r.appt.id}
            onRow={(r) => openPatient(r.patient.id)}
            pageSize={8}
            empty="No new patients booked this week."
            columns={[
              { key: "p", label: "Patient", strong: true, render: (r) => r.patient.name },
              { key: "l", label: "Area", hideSm: true, render: (r) => r.patient.locality },
              { key: "v", label: "Visit", render: (r) => relDay(slotOf(r.appt).date) + " " + slotOf(r.appt).start },
              { key: "sv", label: "Service", hideSm: true, render: (r) => serviceOf(r.appt).name },
              { key: "i", label: "Intake", hideSm: true, render: (r) => <Badge tone={r.patient.intake === "Complete" ? "ok" : "warn"}>{r.patient.intake}</Badge> },
              { key: "st", label: "Stage", render: (r) => { const st = stageOf(r); return <Badge tone={st.tone}>{st.label}</Badge>; } },
            ]}
          />
        </Panel>

        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Panel title="How they found Deborah" meta="New patients this week">
            <BarList items={Object.entries(sources).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)} />
          </Panel>
          <Panel title="Where the counts come from" flush>
            <div className="c-list">
              {[
                { t: "Enquiries and link opens", d: "Attributed demo figures, not tracked events", page: "Marketing", tab: "performance" },
                { t: "Bookings", d: "New-patient appointments in this week's diary", page: "Bookings", tab: "calendar" },
                { t: "Preparation", d: "Administrative checks per patient", page: "Patients", tab: "preparation" },
                { t: "Follow-up reminders", d: "Admin reminders from last week's treatments", page: "Patients", tab: "followups" },
              ].map((x) => (
                <button key={x.t} type="button" className="c-li" onClick={() => go(x.page, x.tab)}>
                  <div className="grow"><div className="t">{x.t}</div><div className="s">{x.d}</div></div>
                  <span aria-hidden="true" style={{ color: "var(--faint)" }}>→</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </Grid>
    </Page>
  );
}

/* ── Growth ─────────────────────────────────────────────────────────────── */

function Growth({ s }: { s: ClinicState }) {
  const ls = localShare(s);
  const w = week(s);

  const weeks = [
    { label: "Last week", dates: F.LAST_WEEK },
    { label: "This week", dates: F.THIS_WEEK },
    { label: "Next week", dates: F.NEXT_WEEK },
  ].map((x) => { const c = capacityFor(s, x.dates); return { label: x.label, value: pctOf(c.returning, c.booked) }; });

  // Visits on record per patient across the three-week diary.
  const visits: Record<string, number> = {};
  const attendedBy: Record<string, number> = {};
  for (const a of s.appointments) {
    if (a.status === "Cancelled") continue;
    visits[a.patientId] = (visits[a.patientId] || 0) + 1;
    if (a.status === "Attended") attendedBy[a.patientId] = (attendedBy[a.patientId] || 0) + 1;
  }
  const twoPlus = Object.values(visits).filter((n) => n >= 2).length;
  const twoPlusAttended = Object.values(attendedBy).filter((n) => n >= 2).length;

  // Last week's first-time patients who already have a later booking.
  const lastNew = apptsOn(s, F.LAST_WEEK).filter((a) => a.isNew && a.status === "Attended");
  const rebooked = lastNew.filter((a) => s.appointments.some((b) => b.patientId === a.patientId && b.status !== "Cancelled" && slotOf(b).date > SNAPSHOT.date)).length;

  const ob = onboardingStats(s);
  const scenario = w.capacity + F.EXPANSION.addedSlots;
  const outstanding = F.ONBOARDING.filter((o) => !s.onboarding[o.id]);

  return (
    <Page title="Growth" sub="Who is booking, who comes back, and what a second practitioner could add.">
      <Grid cols="1fr 1fr">
        <Panel title="Local share of new patients" meta="Target localities, this week"
          actions={<Btn size="sm" onClick={() => go("Marketing", "local")}>Local growth</Btn>}>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 14 }}>
            <Figure label="From target areas" value={ls.pct + "%"} tone="accent" note={ls.local + " of " + ls.newPatients + " new patients"} />
            <Figure label="From elsewhere" value={ls.elsewhereTotal} note={ls.elsewhere.slice(0, 3).map((e) => e.area).join(", ") || "None"} />
          </div>
          <BarList items={[...ls.byLocality.map((b) => ({ label: b.area, value: b.count })), { label: "Elsewhere", value: ls.elsewhereTotal, muted: true }]} />
        </Panel>

        <Panel title="Repeat visits" meta="From appointments on record"
          actions={<Btn size="sm" variant="ghost" onClick={() => go("Patients", "directory")}>Patients</Btn>}>
          <Grid cols="1fr 1fr" style={{ alignItems: "end" }}>
            <div style={{ display: "grid", gap: 14 }}>
              <Figure label="Returning share this week" value={pctOf(w.returning, w.booked) + "%"} tone="accent" note={w.returning + " of " + w.booked + " booked appointments"} />
              <Figure label="Patients with 2 or more visits" value={twoPlus} note={"Attended or booked; " + twoPlusAttended + " with 2 or more attended so far"} />
              <Figure label="Last week's new patients rebooked" value={rebooked + " of " + lastNew.length} note="Already have a later appointment" />
            </div>
            <Columns items={weeks} format={(n) => n + "%"} height={170} />
          </Grid>
          <div style={{ marginTop: 12 }}>
            <Note>The demo diary covers three weeks, so visit counts start from last week. A real diary import would show the longer history.</Note>
          </div>
        </Panel>
      </Grid>

      <Panel title="Proposed practitioner capacity" tint
        meta={<Badge tone="warn">Scenario, not current availability</Badge>}
        actions={<Btn size="sm" variant="primary" onClick={() => go("Work", "onboarding")}>Open onboarding</Btn>}>
        <Grid cols="1fr 1.1fr 1.2fr">
          <Columns items={[{ label: "Today", value: w.capacity, muted: true }, { label: "Scenario", value: scenario }]} format={(n) => n + " slots"} height={150} />
          <div>
            <Kv items={[
              ["Current weekly slots", w.capacity + " across " + F.THIS_WEEK.length + " clinic days"],
              ["Added in scenario", F.EXPANSION.addedSlots + " slots (" + F.EXPANSION.days + " days, " + F.EXPANSION.slotsPerDay + " a day)"],
              ["Scenario total", scenario + " slots a week"],
              ["Practitioner", <>Emma Byrne <DemoTag>Fictional placeholder</DemoTag></>],
              ["Planned services", F.EXPANSION_SERVICES.map((e) => e.name).join(", ")],
            ]} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: "var(--body)" }}>Onboarding progress</span>
              <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{ob.done} of {ob.total}, {ob.pct}%</b>
            </div>
            <Progress value={ob.done} max={ob.total} label="Practitioner onboarding progress" />
            {outstanding.length ? (
              <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12.5, color: "var(--body)", lineHeight: 1.6 }}>
                {outstanding.map((o) => <li key={o.id}>{o.title}</li>)}
              </ul>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--body)", margin: "12px 0 0" }}>Every onboarding item is complete. Opening the extra slots is still Deborah's decision.</p>
            )}
          </div>
        </Grid>
        <div style={{ marginTop: 12 }}>
          <Note>None of these slots are bookable. They only become real once working days, room time, documentation and access scope are confirmed, and Deborah opens them in Bookings.</Note>
        </div>
      </Panel>
    </Page>
  );
}
