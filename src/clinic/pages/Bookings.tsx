/* Bookings module: overview, calendar, online booking preview, waitlist and
   capacity. Every figure reads from the clinic store and selectors so the
   calendar, today's counts and the waitlist move together. Nothing here
   sends a message or takes a payment. */

import { useEffect, useState, type ReactNode } from "react";
import * as F from "../fixtures";
import {
  useClinic, useUi, go, openPatient, takeFocus, toast, slotsOn, fits, isOpen,
  bookAppointment, rescheduleAppointment, draftOffer, approveOffer, declineOffer, confirmWaitlistBooking,
  type ClinicState, type NewPatientInput,
} from "../store";
import { apptsOn, apptBySlot, openSlots, week, today, capacityFor, prepRows, onboardingStats, patientOf, slotOf, type PrepRow } from "../selectors";
import { SNAPSHOT, dayLabel, dayLong, dateShort, relDay, eur, toMin, plural } from "../format";
import {
  Page, Grid, Panel, Stats, Stat, Badge, Btn, Table, Drawer, Tabs, Field, Search, Empty, Note, Kv, BarList, Columns, Progress, DemoTag, cls,
  type Column, type Tone,
} from "../ui";

/* ── helpers ────────────────────────────────────────────────────────────── */
const WEEKS = [F.LAST_WEEK, F.THIS_WEEK, F.NEXT_WEEK];
const WEEK_NAMES = ["Last week", "This week", "Next week"];
const FUTURE_DAYS = [...F.THIS_WEEK, ...F.NEXT_WEEK];
const roomName = (id: F.RoomId) => F.ROOMS.find((r) => r.id === id)?.name ?? id;
const isPast = (sl: F.Slot) => sl.date < SNAPSHOT.date || (sl.date === SNAPSHOT.date && toMin(sl.start) < toMin(SNAPSHOT.time));
const slotLabel = (sl: F.Slot) => relDay(sl.date) + " " + sl.start;
const weekIndexOf = (date: string) => WEEKS.findIndex((w) => w.includes(date));

/** Open, future slots this week and next where the service fits. */
function fittingOpen(s: ClinicState, serviceId: F.ServiceId, exclude?: string): F.Slot[] {
  return openSlots(s, FUTURE_DAYS).filter((sl) => sl.id !== exclude && fits(sl, serviceId).ok);
}
function byDay(slots: F.Slot[]): [string, F.Slot[]][] {
  const m = new Map<string, F.Slot[]>();
  for (const sl of slots) m.set(sl.date, [...(m.get(sl.date) || []), sl]);
  return [...m.entries()];
}
const apptTone = (st: F.ApptStatus): Tone =>
  st === "Confirmed" ? "ok" : st === "Did not attend" ? "warn" : st === "Cancelled" ? "bad" : st === "Attended" ? "outline" : "neutral";
const offerTone = (st: F.OfferStatus): Tone =>
  st === "Booked" ? "ok" : st === "Offer drafted" ? "accent" : st === "Sent in demo" ? "warn" : "neutral";
const unresolvedPrepByAppt = (s: ClinicState) => {
  const m: Record<string, PrepRow> = {};
  for (const p of prepRows(s)) if (!p.resolved && p.appointment) m[p.appointment.id] = p;
  return m;
};
const dim = (children: ReactNode) => <span style={{ color: "var(--dim)" }}>{children}</span>;
const row = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const };

export default function Bookings({ tab }: { tab: string; v: any }) {
  switch (tab) {
    case "calendar": return <CalendarTab />;
    case "online": return <OnlineTab />;
    case "waitlist": return <WaitlistTab />;
    case "capacity": return <CapacityTab />;
    default: return <OverviewTab />;
  }
}

/* ── Overview ───────────────────────────────────────────────────────────── */
function OverviewTab() {
  const s = useClinic();
  const t = today(s), w = week(s);
  const todays = apptsOn(s, [SNAPSHOT.date]);
  const prepBy = unresolvedPrepByAppt(s);
  const waiting = s.waitlist.filter((x) => x.status !== "Booked");
  const inProgress = waiting.filter((x) => x.status === "Offer drafted" || x.status === "Sent in demo").length;
  const weekAppts = apptsOn(s, F.THIS_WEEK);
  const mix = F.SERVICES.map((sv) => ({ label: sv.name, value: weekAppts.filter((a) => a.serviceId === sv.id).length }));
  const open = openSlots(s, F.THIS_WEEK);
  const alerts = prepRows(s).filter((p) => !p.resolved && p.date >= SNAPSHOT.date);

  const cols: Column<F.Appointment>[] = [
    { key: "t", label: "Time", width: "64px", render: (a) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{slotOf(a).start}</span> },
    { key: "p", label: "Patient", strong: true, render: (a) => <span style={row}>{patientOf(s, a.patientId).name}{a.isNew && <Badge tone="accent">New</Badge>}</span> },
    { key: "s", label: "Service", render: (a) => F.SERVICE_BY_ID[a.serviceId].name },
    { key: "r", label: "Room", hideSm: true, render: (a) => roomName(F.SERVICE_BY_ID[a.serviceId].room) },
    { key: "prep", label: "Preparation", render: (a) => prepBy[a.id] ? <Badge tone="warn" title={prepBy[a.id].issue}>{prepBy[a.id].kind}</Badge> : <Badge tone="ok">Ready</Badge> },
    { key: "st", label: "Status", hideSm: true, render: (a) => <Badge tone={apptTone(a.status)}>{a.status}</Badge> },
  ];

  return (
    <Page title="Bookings" sub={dayLong(SNAPSHOT.date) + ". Deborah's diary, three clinic days a week."}
      actions={<Btn variant="primary" onClick={() => go("Bookings", "calendar")}>Open calendar</Btn>}>
      <Stats min={140}>
        <Stat label="Today" value={t.booked + " booked"} note={plural(t.open, "slot") + " open"} onClick={() => go("Bookings", "calendar")} />
        <Stat label="This week" value={w.booked + " of " + w.capacity} note={w.open + " open slots"} onClick={() => go("Bookings", "capacity")} />
        <Stat label="Slot utilisation" value={w.utilisation + "%"} note="Booked slots out of configured slots" tone="accent" />
        <Stat label="Waitlist" value={waiting.length} note={inProgress ? plural(inProgress, "offer") + " in progress" : "No offers in progress"} onClick={() => go("Bookings", "waitlist")} />
      </Stats>

      <Grid cols="minmax(0,1.55fr) minmax(0,1fr)">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Panel title="Today" meta={t.booked + " booked, " + t.open + " open"} flush
            actions={<Btn size="sm" variant="ghost" onClick={() => go("Patients", "preparation")}>Preparation</Btn>}>
            <Table columns={cols} rows={todays} rowKey={(a) => a.id} onRow={(a) => openPatient(a.patientId)} empty="No appointments today." />
          </Panel>
          <Panel title="Appointment mix this week" meta={plural(weekAppts.length, "appointment")}>
            <BarList items={mix} />
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Panel title="Open slots this week" meta={open.length + " open"} flush
            actions={<Btn size="sm" onClick={() => go("Bookings", "waitlist")}>Fill from waitlist</Btn>}>
            {open.length ? (
              <div className="c-list">
                {open.map((sl) => {
                  const fitCount = waiting.filter((x) => x.status === "Not offered" && fits(sl, x.serviceId).ok).length;
                  return (
                    <div className="c-li" key={sl.id}>
                      <div className="grow">
                        <div className="t">{slotLabel(sl)}</div>
                        <div className="s">{sl.length} min, {roomName(sl.room).toLowerCase()}{fitCount ? ", " + fitCount + " on the waitlist fit" : ""}</div>
                      </div>
                      <Btn size="sm" variant="ghost" onClick={() => go("Bookings", "calendar", sl.id)}>Book</Btn>
                    </div>
                  );
                })}
              </div>
            ) : <Empty title="Fully booked">Every slot this week is taken.</Empty>}
          </Panel>
          <Panel title="Preparation alerts" meta={alerts.length ? alerts.length + " to clear" : "All clear"} flush
            actions={<Btn size="sm" variant="ghost" onClick={() => go("Patients", "preparation")}>Open</Btn>}>
            {alerts.length ? (
              <div className="c-list">
                {alerts.map((p) => (
                  <button type="button" className="c-li c-focus" key={p.id} onClick={() => go("Patients", "preparation")}>
                    <div className="grow">
                      <div className="t">{p.patient.name}</div>
                      <div className="s c-ellipsis">{p.issue}</div>
                    </div>
                    <Badge tone="warn">{relDay(p.date)}</Badge>
                  </button>
                ))}
              </div>
            ) : <Empty title="Nothing outstanding">Every upcoming appointment has its admin checks done.</Empty>}
            <div style={{ padding: "8px 18px 0" }}><Note>Administrative checks only. No clinical assessment happens here.</Note></div>
          </Panel>
        </div>
      </Grid>
    </Page>
  );
}

/* ── Calendar ───────────────────────────────────────────────────────────── */
type Sel = { kind: "appt"; id: string } | { kind: "slot"; id: string } | null;

function CalendarTab() {
  const s = useClinic();
  const ui = useUi();
  const [wk, setWk] = useState(1);
  const [view, setView] = useState<"week" | "day">("week");
  const [day, setDay] = useState(SNAPSHOT.date);
  const [prac, setPrac] = useState("PER-DG");
  const [room, setRoom] = useState<"all" | F.RoomId>("all");
  const [sel, setSel] = useState<Sel>(null);

  const jumpTo = (date: string) => {
    const i = weekIndexOf(date);
    if (i >= 0) { setWk(i); setDay(date); }
  };
  const changeWeek = (i: number) => {
    setWk(i);
    setDay(WEEKS[i].includes(SNAPSHOT.date) ? SNAPSHOT.date : WEEKS[i][0]);
  };

  // A deep link (go("Bookings","calendar",id)) may hold an appointment or slot id.
  const pending = ui.focus["Bookings"];
  useEffect(() => {
    if (!pending) return;
    if (pending.startsWith("APT-")) {
      const a = s.appointments.find((x) => x.id === pending);
      if (!a) return;
      takeFocus("Bookings");
      jumpTo(slotOf(a).date);
      setSel({ kind: "appt", id: a.id });
    } else if (pending.startsWith("SLOT-") && F.SLOT_BY_ID[pending]) {
      takeFocus("Bookings");
      const sl = F.SLOT_BY_ID[pending];
      jumpTo(sl.date);
      const a = apptBySlot(s)[sl.id];
      setSel(a ? { kind: "appt", id: a.id } : { kind: "slot", id: sl.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, s]);

  const dates = WEEKS[wk];
  const readOnly = wk === 0;
  const cap = capacityFor(s, dates);
  const shown = view === "week" ? dates : [day];

  return (
    <Page title="Calendar" sub={WEEK_NAMES[wk] + ": " + dayLabel(dates[0]) + " to " + dayLabel(dates[dates.length - 1]) + ". " + cap.booked + " of " + cap.capacity + " slots booked."}
      actions={
        <div style={row}>
          <Btn size="sm" onClick={() => changeWeek(wk - 1)} disabled={wk === 0}>Previous week</Btn>
          <Btn size="sm" onClick={() => changeWeek(1)} disabled={wk === 1}>This week</Btn>
          <Btn size="sm" onClick={() => changeWeek(wk + 1)} disabled={wk === 2}>Next week</Btn>
        </div>
      }>
      <div style={{ ...row, gap: 10 }}>
        <Tabs items={[{ id: "week", label: "Week" }, { id: "day", label: "Day" }]} value={view} onChange={setView} />
        {view === "day" && <Tabs items={dates.map((d) => ({ id: d, label: relDay(d) }))} value={day} onChange={setDay} />}
        <select className="c-select" style={{ width: "auto", minWidth: 170 }} aria-label="Practitioner" value={prac} onChange={(e) => setPrac(e.target.value)}>
          {F.PRACTITIONERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="c-select" style={{ width: "auto", minWidth: 150 }} aria-label="Room" value={room} onChange={(e) => setRoom(e.target.value as "all" | F.RoomId)}>
          <option value="all">All rooms</option>
          {F.ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {readOnly && <Badge tone="outline">Read-only: past week</Badge>}
      </div>

      {prac !== "PER-DG" ? (
        <Panel>
          <Empty title="No diary yet, planned only" action={<Btn onClick={() => go("Bookings", "capacity")}>See the expansion scenario</Btn>}>
            Emma Byrne is a fictional placeholder for a prospective practitioner. She is not employed and has no diary. One would appear only after her working days and room time are confirmed.
          </Empty>
        </Panel>
      ) : (
        <div className="c-cal" style={{ gridTemplateColumns: view === "week" ? "repeat(auto-fit,minmax(250px,1fr))" : "minmax(0,1fr)" }}>
          {shown.map((d) => <DayColumn key={d} date={d} room={room} onPick={setSel} />)}
        </div>
      )}
      <div style={{ ...row, fontSize: 12, color: "var(--dim)" }}>
        <span className="c-slot open" style={{ width: "auto", padding: "3px 8px", borderRadius: 6, cursor: "default" }}><span className="who">Open</span></span>
        Open slots can be booked from here. Select a booked slot to see the appointment or move it.
      </div>

      {sel?.kind === "appt" && (
        <ApptDrawer key={sel.id} id={sel.id} onClose={() => setSel(null)} onMoved={jumpTo} />
      )}
      {sel?.kind === "slot" && (
        <SlotDrawer key={sel.id} id={sel.id} onClose={() => setSel(null)} onBooked={(apptId) => setSel({ kind: "appt", id: apptId })} />
      )}
    </Page>
  );
}

function DayColumn({ date, room, onPick }: { date: string; room: "all" | F.RoomId; onPick: (s: Sel) => void }) {
  const s = useClinic();
  const bySlot = apptBySlot(s);
  const prepBy = unresolvedPrepByAppt(s);
  const slots = slotsOn(date);
  const cap = capacityFor(s, [date]);
  const breaksDone = F.HOURS.breaks.map(() => false);
  const rows: ReactNode[] = [];

  const pushBreaks = (beforeMin: number) => {
    F.HOURS.breaks.forEach((b, i) => {
      if (!breaksDone[i] && toMin(b.start) <= beforeMin) {
        breaksDone[i] = true;
        rows.push(
          <div key={"brk" + i} className="c-slot brk" role="presentation">
            <span className="tm">{b.start}</span><span>{b.label}, {b.start} to {b.end}</span>
          </div>,
        );
      }
    });
  };

  for (const sl of slots) {
    pushBreaks(toMin(sl.start));
    const a = bySlot[sl.id];
    const roomId = a ? F.SERVICE_BY_ID[a.serviceId].room : sl.room;
    if (room !== "all" && roomId !== room) continue;
    const past = isPast(sl);
    if (a) {
      const p = patientOf(s, a.patientId);
      rows.push(
        <button key={sl.id} type="button" className="c-slot c-focus" onClick={() => onPick({ kind: "appt", id: a.id })}>
          <span className="tm">{sl.start}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="who c-ellipsis" style={{ display: "block", color: "var(--ink)" }}>{p.name}</span>
            <span className="c-ellipsis" style={{ display: "block", fontSize: 11, color: "var(--dim)" }}>{F.SERVICE_BY_ID[a.serviceId].name}, {roomName(roomId).toLowerCase()}</span>
          </span>
          {prepBy[a.id] && <Badge tone="warn" title={prepBy[a.id].issue}>Prep</Badge>}
          {a.isNew && <Badge tone="accent">New</Badge>}
        </button>,
      );
    } else {
      rows.push(
        <button key={sl.id} type="button" className={cls("c-slot c-focus", !past && "open")} disabled={past}
          onClick={() => onPick({ kind: "slot", id: sl.id })}>
          <span className="tm">{sl.start}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="who" style={{ display: "block" }}>{past ? "Not used" : "Open"}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--dim)" }}>{sl.length} min, {roomName(sl.room).toLowerCase()}</span>
          </span>
        </button>,
      );
    }
  }
  pushBreaks(24 * 60);

  return (
    <div className="c-cal-day">
      <h4>
        {dayLabel(date)}
        {date === SNAPSHOT.date && <Badge tone="accent">Today</Badge>}
        <span className="c-meta" style={{ marginLeft: "auto", fontWeight: 400, fontSize: 11.5, color: "var(--dim)" }}>{cap.booked} of {cap.capacity} booked</span>
      </h4>
      {rows}
    </div>
  );
}

function ApptDrawer({ id, onClose, onMoved }: { id: string; onClose: () => void; onMoved: (date: string) => void }) {
  const s = useClinic();
  const [target, setTarget] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const a = s.appointments.find((x) => x.id === id);
  if (!a) return null;
  const sl = slotOf(a);
  const sv = F.SERVICE_BY_ID[a.serviceId];
  const p = patientOf(s, a.patientId);
  const readOnly = isPast(sl) || a.status === "Attended" || a.status === "Did not attend" || a.status === "Cancelled";
  const options = readOnly ? [] : fittingOpen(s, a.serviceId, sl.id);
  const prep = prepRows(s).filter((r) => r.appointment?.id === a.id);

  const move = () => {
    if (!target) { setErr("Choose a new time first."); return; }
    const to = F.SLOT_BY_ID[target];
    const r = rescheduleAppointment(a.id, target);
    if (!r.ok) { setErr(r.error); return; }
    setErr(null); setTarget("");
    toast(p.name + " moved to " + dayLabel(to.date) + " " + to.start + ". No message was sent to the patient.");
    onMoved(to.date);
  };

  return (
    <Drawer open onClose={onClose} title={p.name} sub={dayLong(sl.date) + ", " + sl.start + " to " + sl.end}
      footer={<><Btn onClick={onClose}>Close</Btn><Btn variant="primary" onClick={() => openPatient(p.id)}>Open patient record</Btn></>}>
      <Kv items={[
        ["Patient", <button type="button" className="c-btn sm ghost" onClick={() => openPatient(p.id)}>{p.name} ({p.id})</button>],
        ["Service", sv.name + ", " + sv.duration + " min"],
        ["Room", roomName(sv.room)],
        ["Status", <Badge tone={apptTone(a.status)}>{a.status}</Badge>],
        ["Booked via", a.bookedVia],
        ["Visit", a.isNew ? "First visit" : "Returning patient"],
        ["Contact", p.contactPref],
      ]} />
      {prep.map((r) => (
        <Note key={r.id} tone={r.resolved ? undefined : "warn"}>
          {r.resolved ? "Cleared: " : "Preparation check: "}{r.issue}.{" "}
          {!r.resolved && <button type="button" className="c-btn sm ghost" onClick={() => go("Patients", "preparation")}>Open preparation</button>}
        </Note>
      ))}
      {readOnly ? (
        <Note>This appointment is in the past, so it is read-only.</Note>
      ) : (
        <Panel title="Reschedule" meta={plural(options.length, "open time") + " fit this service"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="New time" htmlFor="resched" error={err} hint="Only open times that fit the service length, turnover and lunch break are listed.">
              <select id="resched" className="c-select" value={target} onChange={(e) => { setTarget(e.target.value); setErr(null); }}>
                <option value="">Choose a time</option>
                {byDay(options).map(([d, list]) => (
                  <optgroup key={d} label={dayLabel(d)}>
                    {list.map((o) => <option key={o.id} value={o.id}>{o.start} ({o.length} min)</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <div><Btn variant="primary" onClick={move} disabled={!options.length}>Move appointment</Btn></div>
          </div>
        </Panel>
      )}
    </Drawer>
  );
}

function SlotDrawer({ id, onClose, onBooked }: { id: string; onClose: () => void; onBooked: (apptId: string) => void }) {
  const s = useClinic();
  const sl = F.SLOT_BY_ID[id];
  const services = F.SERVICES.filter((sv) => fits(sl, sv.id).ok);
  const [svc, setSvc] = useState<F.ServiceId | "">(services.find((x) => x.id === sl.kind)?.id ?? services[0]?.id ?? "");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [q, setQ] = useState("");
  const [pid, setPid] = useState<string | null>(null);
  const [np, setNp] = useState<NewPatientInput>({ first: "", last: "", locality: F.TARGET_AREAS[0], contactPref: "Phone" });
  const [err, setErr] = useState<string | null>(null);

  const stillOpen = isOpen(s, id);
  const past = isPast(sl);
  const query = q.trim().toLowerCase();
  const matches = query.length >= 2 ? s.patients.filter((p) => (p.name + " " + p.id).toLowerCase().includes(query)).slice(0, 6) : [];
  const chosen = pid ? s.patients.find((p) => p.id === pid) : undefined;

  const book = () => {
    if (!svc) { setErr("No service fits this slot."); return; }
    if (mode === "existing" && !pid) { setErr("Choose a patient first."); return; }
    const r = bookAppointment({ slotId: id, serviceId: svc, via: "Phone", ...(mode === "existing" ? { patientId: pid ?? undefined } : { newPatient: np }) });
    if (!r.ok) { setErr(r.error); return; }
    toast("Booked for " + dayLabel(sl.date) + " " + sl.start + ". Logged as a phone booking; no confirmation was sent.");
    if (r.id) onBooked(r.id);
  };

  return (
    <Drawer open onClose={onClose} title={"Open slot, " + sl.start} sub={dayLong(sl.date) + ", " + sl.length + " min, " + roomName(sl.room).toLowerCase()}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={book} disabled={!stillOpen || past || !services.length}>Book this slot</Btn></>}>
      {!stillOpen && <Note tone="warn">This slot has just been taken. Close and pick another time.</Note>}
      {past && <Note>This time has passed and cannot be booked.</Note>}
      <Field label="Service" htmlFor="svc" hint="Only services that fit this slot, with turnover and the lunch break, are listed.">
        <select id="svc" className="c-select" value={svc} onChange={(e) => setSvc(e.target.value as F.ServiceId)}>
          {services.map((sv) => <option key={sv.id} value={sv.id}>{sv.name} ({sv.duration} min)</option>)}
        </select>
      </Field>
      <Tabs items={[{ id: "existing", label: "Existing patient" }, { id: "new", label: "New patient" }]} value={mode} onChange={(m) => { setMode(m); setErr(null); }} />
      {mode === "existing" ? (
        chosen ? (
          <div className="c-li" style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div className="grow"><div className="t">{chosen.name}</div><div className="s">{chosen.id}, {chosen.locality}, prefers {chosen.contactPref}</div></div>
            <Btn size="sm" variant="ghost" onClick={() => setPid(null)}>Change</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Search value={q} onChange={setQ} placeholder="Search by name or patient ID" label="Search patients" />
            {query.length < 2 ? dim(<span style={{ fontSize: 12 }}>Type at least two letters.</span>) : matches.length ? (
              <div className="c-list" style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                {matches.map((p) => (
                  <button type="button" key={p.id} className="c-li c-focus" onClick={() => { setPid(p.id); setErr(null); }}>
                    <div className="grow"><div className="t">{p.name}</div><div className="s">{p.id}, {p.locality}</div></div>
                  </button>
                ))}
              </div>
            ) : dim(<span style={{ fontSize: 12 }}>No match. Switch to New patient to add one.</span>)}
          </div>
        )
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <Field label="First name" htmlFor="np-first"><input id="np-first" className="c-input" value={np.first} onChange={(e) => setNp({ ...np, first: e.target.value })} /></Field>
          <Field label="Last name" htmlFor="np-last"><input id="np-last" className="c-input" value={np.last} onChange={(e) => setNp({ ...np, last: e.target.value })} /></Field>
          <Field label="Locality" htmlFor="np-loc">
            <select id="np-loc" className="c-select" value={np.locality} onChange={(e) => setNp({ ...np, locality: e.target.value })}>
              {LOCALITIES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Contact preference" htmlFor="np-pref">
            <select id="np-pref" className="c-select" value={np.contactPref} onChange={(e) => setNp({ ...np, contactPref: e.target.value as F.ContactPref })}>
              {CONTACT_PREFS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      )}
      {mode === "new" && <Note>Use fictional details only. This is demo data.</Note>}
      {err && <Note tone="warn">{err}</Note>}
    </Drawer>
  );
}

/* ── Online booking preview ─────────────────────────────────────────────── */
const LOCALITIES = [...F.TARGET_AREAS, "Clonskeagh", "Ranelagh", "Rathgar", "Churchtown", "Elsewhere in Dublin"];
const CONTACT_PREFS: F.ContactPref[] = ["Instagram DM", "WhatsApp", "Phone", "Email"];
const STEP_NAMES = ["Treatment", "Time", "Your details", "Confirm"];
const NAME_RE = /^[\p{L}][\p{L}' -]*[\p{L}]$/u;

function OnlineTab() {
  const s = useClinic();
  const [step, setStep] = useState(0);
  const [svc, setSvc] = useState<F.ServiceId | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [form, setForm] = useState<NewPatientInput>({ first: "", last: "", locality: "", contactPref: "Instagram DM" });
  const [touched, setTouched] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const service = svc ? F.SERVICE_BY_ID[svc] : null;
  const slot = slotId ? F.SLOT_BY_ID[slotId] : null;
  const available = svc ? fittingOpen(s, svc) : [];
  const fieldErr = {
    first: !form.first.trim() ? "Add your first name." : !NAME_RE.test(form.first.trim()) ? "Letters only, please." : null,
    last: !form.last.trim() ? "Add your last name." : !NAME_RE.test(form.last.trim()) ? "Letters only, please." : null,
    locality: !form.locality ? "Choose where you live." : null,
  };
  const formOk = !fieldErr.first && !fieldErr.last && !fieldErr.locality;
  const onlineBookings = s.appointments.filter((a) => a.bookedVia === "Online booking (demo)" && a.status !== "Cancelled");

  const restart = () => { setStep(0); setSvc(null); setSlotId(null); setForm({ first: "", last: "", locality: "", contactPref: "Instagram DM" }); setTouched(false); setErr(null); setDone(null); };
  const confirm = () => {
    if (!svc || !slotId) return;
    const r = bookAppointment({ slotId, serviceId: svc, newPatient: { ...form, first: form.first.trim(), last: form.last.trim() }, via: "Online booking (demo)" });
    if (!r.ok) { setErr(r.error); return; }
    setErr(null);
    setDone(r.id ?? null);
    toast("Demo booking added to the calendar. Nothing was sent.");
  };

  const frame = (
    <div style={{ maxWidth: 400, width: "100%", margin: "0 auto", border: "1px solid var(--border-strong)", borderRadius: 24, background: "var(--surface-2)", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Book with Deborah Gough</div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Aesthetics Clinic, Milltown, Dublin</div>
        {!done && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginTop: 12 }} aria-label={"Step " + (step + 1) + " of 4"}>
            {STEP_NAMES.map((n, i) => (
              <div key={n} style={{ fontSize: 10.5, color: i === step ? "var(--accent)" : "var(--faint)", fontWeight: i === step ? 600 : 400 }}>
                <div style={{ height: 3, borderRadius: 3, marginBottom: 5, background: i <= step ? "var(--accent)" : "var(--track)" }} />
                {n}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 320 }}>
        {done ? (
          <>
            <Badge tone="ok">Demo booking made</Badge>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>You're booked in, {form.first.trim()}.</div>
            {slot && service && <Kv items={[["Treatment", service.name], ["When", dayLong(slot.date) + ", " + slot.start], ["Where", "Milltown, near the Eurospar"]]} />}
            <Note>This is a demo booking. Nothing was sent: no email, text or message left Pulse, and no payment was taken.</Note>
            <div style={row}>
              {done && <Btn variant="primary" onClick={() => go("Bookings", "calendar", done)}>See it in the calendar</Btn>}
              <Btn onClick={restart}>Start another</Btn>
            </div>
          </>
        ) : step === 0 ? (
          <>
            <div style={{ ...row, justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Choose a treatment</span>
              <DemoTag>Illustrative prices</DemoTag>
            </div>
            <div className="c-list" style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              {F.SERVICES.map((sv) => (
                <button type="button" key={sv.id} className="c-li c-focus" aria-pressed={svc === sv.id}
                  style={svc === sv.id ? { background: "var(--accent-faint)" } : undefined}
                  onClick={() => { setSvc(sv.id); setSlotId(null); setErr(null); }}>
                  <div className="grow">
                    <div className="t">{sv.name}</div>
                    <div className="s">{sv.duration} min{sv.price === 0 ? ", for returning patients only" : sv.forNewPatients ? ", suits new patients" : ", for existing patients"}</div>
                  </div>
                  <span style={{ fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{sv.price ? eur(sv.price) : "No charge"}</span>
                </button>
              ))}
            </div>
            <Btn variant="primary" disabled={!svc} onClick={() => setStep(1)}>Continue</Btn>
          </>
        ) : step === 1 && service ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Pick a time for {service.name.toLowerCase()}</span>
            {available.length ? byDay(available).map(([d, list]) => (
              <div key={d}>
                <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 6 }}>{relDay(d) === dayLabel(d) ? dayLabel(d) : relDay(d) + ", " + dayLabel(d)}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {list.map((o) => (
                    <Btn key={o.id} size="sm" variant={slotId === o.id ? "primary" : "secondary"} onClick={() => { setSlotId(o.id); setErr(null); }}>{o.start}</Btn>
                  ))}
                </div>
              </div>
            )) : <Empty title="No times free">Nothing fits this treatment over the next two weeks. Try another treatment.</Empty>}
            <div style={row}>
              <Btn onClick={() => setStep(0)}>Back</Btn>
              <Btn variant="primary" disabled={!slotId || !available.some((o) => o.id === slotId)} onClick={() => setStep(2)}>Continue</Btn>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Your details</span>
            <Field label="First name" htmlFor="ob-first" error={touched ? fieldErr.first : null}>
              <input id="ob-first" className="c-input" autoComplete="off" value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} />
            </Field>
            <Field label="Last name" htmlFor="ob-last" error={touched ? fieldErr.last : null}>
              <input id="ob-last" className="c-input" autoComplete="off" value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} />
            </Field>
            <Field label="Where do you live?" htmlFor="ob-loc" error={touched ? fieldErr.locality : null}>
              <select id="ob-loc" className="c-select" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })}>
                <option value="">Choose an area</option>
                {LOCALITIES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="How should Deborah contact you?" htmlFor="ob-pref">
              <select id="ob-pref" className="c-select" value={form.contactPref} onChange={(e) => setForm({ ...form, contactPref: e.target.value as F.ContactPref })}>
                {CONTACT_PREFS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Note>Demo only: use made-up details.</Note>
            <div style={row}>
              <Btn onClick={() => setStep(1)}>Back</Btn>
              <Btn variant="primary" onClick={() => { setTouched(true); if (formOk) setStep(3); }}>Continue</Btn>
            </div>
          </>
        ) : step === 3 && service && slot ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Check and confirm</span>
            <Kv items={[
              ["Treatment", service.name + ", " + service.duration + " min"],
              ["When", dayLong(slot.date) + ", " + slot.start],
              ["Name", form.first.trim() + " " + form.last.trim()],
              ["Area", form.locality],
              ["Contact", form.contactPref],
              ["Price", service.price ? eur(service.price) + " (illustrative)" : "No charge"],
            ]} />
            {err && (
              <Note tone="warn">
                {err}{" "}
                <button type="button" className="c-btn sm ghost" onClick={() => { setSlotId(null); setErr(null); setStep(1); }}>Choose another time</button>
              </Note>
            )}
            <div style={row}>
              <Btn onClick={() => setStep(2)}>Back</Btn>
              <Btn variant="primary" onClick={confirm}>Confirm booking</Btn>
            </div>
          </>
        ) : (
          <Btn onClick={restart}>Start again</Btn>
        )}
      </div>
    </div>
  );

  return (
    <Page title="Online booking" sub="What a patient would see on Deborah's booking page. Bookings made here land in the real demo calendar.">
      <Grid cols="minmax(0,1.3fr) minmax(0,1fr)">
        <Panel title="Preview: patient-facing booking (demo)" meta={<DemoTag>Demo</DemoTag>}>
          {frame}
        </Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Panel title="How it works">
            <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
              <div>Patients only see open times where the treatment fits, including room turnover and the lunch break.</div>
              <div>A confirmed booking takes the slot straight away, so the calendar, today's counts and capacity update together. If someone else takes the time first, the patient is asked to pick again.</div>
              <Note>Not connected to a website. No confirmations are sent and no deposits are taken in this demo.</Note>
            </div>
          </Panel>
          <Panel title="Booked through the preview" meta={plural(onlineBookings.length, "booking")} flush>
            {onlineBookings.length ? (
              <div className="c-list">
                {onlineBookings.map((a) => (
                  <button type="button" key={a.id} className="c-li c-focus" onClick={() => go("Bookings", "calendar", a.id)}>
                    <div className="grow"><div className="t">{patientOf(s, a.patientId).name}</div><div className="s">{F.SERVICE_BY_ID[a.serviceId].name}</div></div>
                    <Badge>{slotLabel(slotOf(a))}</Badge>
                  </button>
                ))}
              </div>
            ) : <Empty title="None yet">Try the preview to add one.</Empty>}
          </Panel>
        </div>
      </Grid>
    </Page>
  );
}

/* ── Waitlist ───────────────────────────────────────────────────────────── */
function offerDraft(s: ClinicState, w: F.WaitlistEntry): { text: string; source: string } {
  const p = patientOf(s, w.patientId);
  const sl = w.matchSlot ? F.SLOT_BY_ID[w.matchSlot] : undefined;
  const conv = w.conversationId ? s.conversations.find((c) => c.id === w.conversationId) : undefined;
  const convText = conv?.sentText || conv?.draft;
  if (conv && convText && sl && convText.includes(sl.start)) return { text: convText, source: "Inbox draft " + conv.id + ", prepared by the Inbox Assistant" };
  const when = sl ? (sl.date === SNAPSHOT.date ? "today at " + sl.start : "on " + dayLabel(sl.date) + " at " + sl.start) : "soon";
  return {
    text: "Hi " + p.first + ", a " + F.SERVICE_BY_ID[w.serviceId].name.toLowerCase() + " slot has opened " + when + " in Milltown. Would that suit you? Reply here and I'll book you in. Deborah",
    source: "Template drafted by the Booking Agent",
  };
}

function WaitlistTab() {
  const s = useClinic();
  const ui = useUi();
  const [sel, setSel] = useState<string | null>(null);
  const [rowErr, setRowErr] = useState<Record<string, string>>({});

  const pending = ui.focus["Bookings"];
  useEffect(() => {
    if (pending && pending.startsWith("WL-") && s.waitlist.some((w) => w.id === pending)) { takeFocus("Bookings"); setSel(pending); }
  }, [pending, s]);

  const confirm = (w: F.WaitlistEntry) => {
    const r = confirmWaitlistBooking(w.id);
    if (!r.ok) { setRowErr({ ...rowErr, [w.id]: r.error }); return; }
    setRowErr({ ...rowErr, [w.id]: "" });
    const sl = w.matchSlot ? F.SLOT_BY_ID[w.matchSlot] : undefined;
    toast(patientOf(s, w.patientId).name + " booked" + (sl ? " for " + slotLabel(sl) : "") + ". Calendar and today's counts updated. Patient reply simulated.");
  };
  const bookedAppt = (w: F.WaitlistEntry) => (w.matchSlot ? apptBySlot(s)[w.matchSlot] : undefined);

  const counts = (["Not offered", "Offer drafted", "Sent in demo", "Booked"] as F.OfferStatus[]).map((st) => ({ st, n: s.waitlist.filter((w) => w.status === st).length }));

  const cols: Column<F.WaitlistEntry>[] = [
    { key: "p", label: "Patient", strong: true, render: (w) => (
      <button type="button" className="c-btn sm ghost" style={{ paddingLeft: 0 }} onClick={() => openPatient(w.patientId)}>{patientOf(s, w.patientId).name}</button>
    ) },
    { key: "s", label: "Service", render: (w) => F.SERVICE_BY_ID[w.serviceId].name },
    { key: "t", label: "Suitable times", hideSm: true, render: (w) => w.suitable },
    { key: "c", label: "Contact", hideSm: true, render: (w) => w.contactPref },
    { key: "a", label: "Added", hideSm: true, render: (w) => dateShort(w.added) },
    { key: "st", label: "Offer", render: (w) => <Badge tone={offerTone(w.status)}>{w.status}</Badge> },
    { key: "act", label: "", render: (w) => {
      if (w.status === "Booked") {
        const a = bookedAppt(w);
        const sl = w.matchSlot ? F.SLOT_BY_ID[w.matchSlot] : undefined;
        return <span style={row}>{dim(sl ? slotLabel(sl) : "Booked")}{a && <Btn size="sm" variant="ghost" onClick={() => go("Bookings", "calendar", a.id)}>View</Btn>}</span>;
      }
      if (w.status === "Sent in demo") return (
        <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
          <Btn size="sm" variant="primary" onClick={() => confirm(w)}>Patient accepted: confirm booking</Btn>
          {rowErr[w.id] && <span style={{ fontSize: 11.5, color: "var(--bad)" }} role="alert">{rowErr[w.id]}</span>}
        </span>
      );
      if (w.status === "Offer drafted") return <Btn size="sm" variant="primary" onClick={() => setSel(w.id)}>Review offer</Btn>;
      return <Btn size="sm" onClick={() => setSel(w.id)}>Find a slot</Btn>;
    } },
  ];

  const current = sel ? s.waitlist.find((w) => w.id === sel) : undefined;

  return (
    <Page title="Waitlist" sub="People waiting for a time. The Booking Agent matches open slots; you approve every offer.">
      <div style={row}>
        {counts.map((c) => <Badge key={c.st} tone={offerTone(c.st)}>{c.st}: {c.n}</Badge>)}
      </div>
      <Panel title="Waiting patients" meta={plural(s.waitlist.length, "entry", "entries")} flush>
        <Table columns={cols} rows={s.waitlist} rowKey={(w) => w.id} empty="Nobody is waiting." />
      </Panel>
      <Note>Offers are never sent from this demo. Approving marks an offer "Sent in demo", and the patient's acceptance is simulated when you confirm.</Note>
      {current && <OfferDrawer key={current.id + current.status} w={current} onClose={() => setSel(null)} onConfirm={() => confirm(current)} />}
    </Page>
  );
}

function OfferDrawer({ w, onClose, onConfirm }: { w: F.WaitlistEntry; onClose: () => void; onConfirm: () => void }) {
  const s = useClinic();
  const [err, setErr] = useState<string | null>(null);
  const p = patientOf(s, w.patientId);
  const sv = F.SERVICE_BY_ID[w.serviceId];
  const sl = w.matchSlot ? F.SLOT_BY_ID[w.matchSlot] : undefined;
  const options = fittingOpen(s, w.serviceId);

  const pick = (slotId: string) => {
    const r = draftOffer(w.id, slotId);
    if (!r.ok) { setErr(r.error); return; }
    setErr(null);
    toast("Offer drafted for " + p.name + ". Waiting for your approval; nothing sent.");
  };
  const approve = () => {
    const r = approveOffer(w.id);
    if (!r.ok) { setErr(r.error); return; }
    if (!w.conversationId) toast("Offer approved. Marked sent in demo; no message left Pulse.");
  };
  const withdraw = () => { declineOffer(w.id); toast("Offer withdrawn. " + p.first + " stays on the waitlist."); };

  const header = (
    <Kv items={[
      ["Patient", <button type="button" className="c-btn sm ghost" onClick={() => openPatient(p.id)}>{p.name} ({p.id})</button>],
      ["Service", sv.name + ", " + sv.duration + " min"],
      ["Suitable times", w.suitable],
      ["Contact", w.contactPref],
      ["On list since", dateShort(w.added)],
      ["Status", <Badge tone={offerTone(w.status)}>{w.status}</Badge>],
    ]} />
  );

  if (w.status === "Offer drafted" && sl) {
    const d = offerDraft(s, w);
    const stillOpen = isOpen(s, sl.id);
    return (
      <Drawer open onClose={onClose} title="Review offer" sub={p.name + ", " + slotLabel(sl)}
        footer={<><Btn variant="ghost" onClick={withdraw}>Withdraw</Btn><Btn variant="primary" onClick={approve} disabled={!stillOpen}>Approve and mark sent in demo</Btn></>}>
        {header}
        {!stillOpen && <Note tone="warn">That slot has been booked by someone else. Withdraw this offer and find another time.</Note>}
        <Field label={"Draft message, " + w.contactPref} hint={d.source}>
          <div className="c-textarea" style={{ minHeight: 0, whiteSpace: "pre-wrap" }}>{d.text}</div>
        </Field>
        <Note>Approving does not send anything. The offer is marked "Sent in demo" so you can walk through the next step.</Note>
        {err && <Note tone="warn">{err}</Note>}
      </Drawer>
    );
  }
  if (w.status === "Sent in demo" && sl) {
    return (
      <Drawer open onClose={onClose} title="Offer sent in demo" sub={p.name + ", " + slotLabel(sl)}
        footer={<><Btn variant="ghost" onClick={withdraw}>Withdraw</Btn><Btn variant="primary" onClick={onConfirm}>Patient accepted: confirm booking</Btn></>}>
        {header}
        <Note>The patient's reply is simulated. Confirming books {slotLabel(sl)}, takes them off the waitlist and updates the calendar and today's counts.</Note>
      </Drawer>
    );
  }
  if (w.status === "Booked") {
    const a = sl ? apptBySlot(s)[sl.id] : undefined;
    return (
      <Drawer open onClose={onClose} title="Booked from the waitlist" sub={p.name}
        footer={a ? <Btn variant="primary" onClick={() => go("Bookings", "calendar", a.id)}>See it in the calendar</Btn> : undefined}>
        {header}
        {sl && <Note>Booked for {dayLong(sl.date)} at {sl.start}.</Note>}
      </Drawer>
    );
  }
  return (
    <Drawer open onClose={onClose} title="Find a slot" sub={p.name + " wants " + sv.name.toLowerCase()}>
      {header}
      {err && <Note tone="warn">{err}</Note>}
      <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Open times this week and next that fit a {sv.duration} min {sv.name.toLowerCase()}. Choose one to draft an offer. Check it against "{w.suitable}".</div>
      {options.length ? byDay(options).map(([d, list]) => (
        <div key={d}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{relDay(d) === dayLabel(d) ? dayLabel(d) : relDay(d) + ", " + dayLabel(d)}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {list.map((o) => <Btn key={o.id} size="sm" onClick={() => pick(o.id)}>{o.start}</Btn>)}
          </div>
        </div>
      )) : <Empty title="No fitting time">Nothing open fits this service over the next two weeks.</Empty>}
    </Drawer>
  );
}

/* ── Capacity ───────────────────────────────────────────────────────────── */
const FILL_RATES = [25, 50, 75];

function CapacityTab() {
  const s = useClinic();
  const w = week(s);
  const ob = onboardingStats(s);
  const [fill, setFill] = useState(50);
  const days = F.THIS_WEEK.map((d) => ({ date: d, ...capacityFor(s, [d]) }));
  const scenario = w.capacity + F.EXPANSION.addedSlots;
  const turnoverSvcs = F.SERVICES.filter((x) => x.turnover > 0);
  const priceBasis = F.SERVICE_BY_ID.consult.price;
  const illustrative = Math.round(F.EXPANSION.addedSlots * (fill / 100) * priceBasis);
  const gate = ["ONB-07", "ONB-08"].map((id) => ({ item: F.ONBOARDING.find((o) => o.id === id)!, done: !!s.onboarding[id] }));
  const emma = F.PEOPLE.find((p) => p.id === "PER-EB");

  const cols: Column<(typeof days)[number]>[] = [
    { key: "d", label: "Day", strong: true, render: (r) => <span style={row}>{dayLabel(r.date)}{r.date === SNAPSHOT.date && <Badge tone="accent">Today</Badge>}</span> },
    { key: "c", label: "Slots", num: true, render: (r) => r.capacity },
    { key: "b", label: "Booked", num: true, render: (r) => r.booked },
    { key: "o", label: "Open", num: true, render: (r) => r.open },
    { key: "u", label: "Slot utilisation", num: true, render: (r) => r.utilisation + "%" },
    { key: "n", label: "New patients", num: true, hideSm: true, render: (r) => r.newPatients },
  ];

  return (
    <Page title="Capacity" sub={"This week: " + dayLabel(F.THIS_WEEK[0]) + " to " + dayLabel(F.THIS_WEEK[F.THIS_WEEK.length - 1]) + ". Deborah is the only active practitioner."}>
      <Stats min={140}>
        <Stat label="Slots this week" value={w.capacity} note={F.THIS_WEEK.length + " clinic days"} />
        <Stat label="Booked" value={w.booked} note={w.newPatients + " new, " + w.returning + " returning"} />
        <Stat label="Open" value={w.open} note="Bookable now" onClick={() => go("Bookings", "calendar")} />
        <Stat label="Slot utilisation" value={w.utilisation + "%"} tone="accent" note="Booked slots out of configured slots" />
      </Stats>

      <Grid cols="minmax(0,1.4fr) minmax(0,1fr)">
        <Panel title="By day" meta={"Configured slots per day: " + days.map((d) => d.capacity).join(", ")} flush>
          <Table columns={cols} rows={days} rowKey={(r) => r.date} onRow={() => go("Bookings", "calendar")} />
        </Panel>
        <Panel title="Clinic hours and rooms">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Kv items={[
              ["Clinic days", F.HOURS.days.join(", ")],
              ["Hours", F.HOURS.open + " to " + F.HOURS.close],
              ...F.HOURS.breaks.map((b): [ReactNode, ReactNode] => [b.label, b.start + " to " + b.end]),
              ["Turnover", Math.max(...turnoverSvcs.map((x) => x.turnover)) + " min after " + turnoverSvcs.map((x) => x.name.toLowerCase()).join(", ")],
              ...F.ROOMS.map((r): [ReactNode, ReactNode] => [r.name, r.note + ". Used for " + F.SERVICES.filter((x) => x.room === r.id).map((x) => x.name.toLowerCase()).join(", ") + "."]),
            ]} />
            <Note>Deborah has reported much longer working days. The demo uses the configured hours above as the default, not those longer days.</Note>
          </div>
        </Panel>
      </Grid>

      <Panel tint title="Expansion scenario" meta={<Badge tone="warn">Scenario, not current availability</Badge>}
        actions={<Btn size="sm" onClick={() => go("Work", "onboarding")}>Open onboarding</Btn>}>
        <Grid cols="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>
            <div>
              A second practitioner working {F.EXPANSION.days} days a week with {F.EXPANSION.slotsPerDay} slots a day would add <strong style={{ color: "var(--ink)" }}>{F.EXPANSION.addedSlots} slots</strong>, taking the week from {w.capacity} to {scenario}.
            </div>
            <div>
              {emma?.name ?? "Emma Byrne"} is a fictional placeholder for the prospective practitioner. She is not employed and has no access or diary.
            </div>
            <div>These slots count only after the practitioner's days and room availability are confirmed.</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <Columns height={140} items={[{ label: "Now", value: w.capacity }, { label: "Scenario", value: scenario, muted: true }]} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            <div style={{ ...row, justifyContent: "space-between", fontSize: 12.5 }}>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>Practitioner onboarding</span>
              <span style={{ color: "var(--dim)" }}>{ob.done} of {ob.total}, {ob.pct}%</span>
            </div>
            <Progress value={ob.done} max={ob.total} label="Practitioner onboarding progress" />
            <div className="c-list">
              {gate.map((g) => (
                <div key={g.item.id} className="c-li" style={{ padding: "6px 0" }}>
                  <div className="grow"><div className="t">{g.item.title}</div></div>
                  <Badge tone={g.done ? "ok" : "warn"}>{g.done ? "Done" : "Not yet"}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Grid>
        <div style={{ marginTop: 14, padding: "12px 14px", border: "1px dashed var(--border-strong)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...row, justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Revenue illustration</span>
            <DemoTag>Illustrative, not a forecast</DemoTag>
          </div>
          <div style={{ ...row, fontSize: 12.5, color: "var(--body)" }}>
            <span>{F.EXPANSION.addedSlots} extra slots × assumed fill rate</span>
            <select className="c-select" style={{ width: "auto", height: 28 }} aria-label="Assumed fill rate" value={fill} onChange={(e) => setFill(Number(e.target.value))}>
              {FILL_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
            <span>× {eur(priceBasis)} = <strong style={{ color: "var(--ink)" }}>{eur(illustrative)} a week</strong></span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--dim)", lineHeight: 1.5 }}>
            Assumptions: {eur(priceBasis)} is the illustrative initial consultation price, used as a stand-in because laser appointment pricing is not set. The fill rate is an assumption you choose. Costs such as room rental and the practitioner's pay are not included.
          </div>
        </div>
      </Panel>
    </Page>
  );
}
