/* Settings: organisation facts, people and proposed permissions, systems,
   governance, AI controls and experience. Nothing here creates accounts,
   changes sign-in or connects a real system: toggles change demo state only
   and every change is written to Activity. */

import { useState, type ReactNode } from "react";
import * as F from "../fixtures";
import { useClinic, go, reset, setSetting, type ClinicState, type Settings } from "../store";
import { activity, approvals } from "../selectors";
import { SNAPSHOT, relDay, plural } from "../format";
import { Page, Grid, Panel, Badge, Btn, Table, Toggle, Note, Kv, Avatar, type Tone, type Column } from "../ui";

export default function SettingsClinic({ tab, v }: { tab: string; v: any }) {
  const s = useClinic();
  switch (tab) {
    case "people": return <People />;
    case "systems": return <Systems />;
    case "governance": return <Governance s={s} />;
    case "ai": return <AiControls s={s} />;
    case "experience": return <Experience s={s} v={v} />;
    default: return <Organisation />;
  }
}

/* ── small helpers ──────────────────────────────────────────────────────── */
function SubHead({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{children}</div>;
}
function Bullets({ items }: { items: ReactNode[] }) {
  return <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--body)", lineHeight: 1.7 }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}
type BoolKey = Exclude<keyof Settings, "timezone">;
function SettingRow({ k, s, title, children }: { k: BoolKey; s: ClinicState; title: string; children: ReactNode }) {
  const on = s.settings[k];
  return (
    <div className="c-li" style={{ alignItems: "flex-start" }}>
      <div className="grow">
        <div className="t">{title}</div>
        <div className="s" style={{ lineHeight: 1.55 }}>{children}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
        <span style={{ fontSize: 11.5, color: on ? "var(--ok)" : "var(--dim)", width: 22, textAlign: "right" }}>{on ? "On" : "Off"}</span>
        <Toggle checked={on} onChange={(x) => setSetting(k, x)} label={title} />
      </div>
    </div>
  );
}

/* ── Organisation ───────────────────────────────────────────────────────── */
function Organisation() {
  const o = F.ORG;
  return (
    <Page>
      <Grid cols="minmax(0,1.15fr) minmax(0,1fr)">
        <Panel title="Organisation" meta="From the discovery call">
          <Kv items={[
            ["Display name", o.name],
            ["Descriptor", o.descriptor],
            ["Legal name", o.legalName],
            ["Structure", o.structure],
            ["Trading name", <Badge key="tn" tone="warn">{o.tradingName}</Badge>],
            ["Profession", o.profession],
            ["Location", o.location],
            ["Premises", o.premises],
            ["Website / domain", <span key="w"><Badge tone="warn">{o.website}</Badge><div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>{o.websiteNote}</div></span>],
            ["Business email", <Badge key="be" tone="warn">{o.businessEmail}</Badge>],
            ["Association", o.association],
            ["Demo snapshot", SNAPSHOT.label + " (" + SNAPSHOT.tz + ")"],
          ]} />
        </Panel>
        <Panel title="Identity, assumptions and demo figures">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <SubHead>Confirmed facts (discovery call)</SubHead>
              <Bullets items={[
                "Deborah Gough, sole trader, a nurse",
                "Milltown, Dublin, near the Eurospar",
                "Rented room, shared with a plastic surgeon",
                "Works alone today; a practitioner may join two days a week",
                "Uses Instagram, Google Calendar, Apple Notes and Revolut",
              ]} />
            </div>
            <div>
              <SubHead>Provisional demo choices</SubHead>
              <Bullets items={[
                <>The {o.monogram} monogram is a placeholder, not a logo.</>,
                <>Palette <code>#345B57</code>, <code>#243735</code>, <code>#9DBBB4</code>, <code>#EFF5F2</code> is provisional for the demo, not verified brand colours.</>,
                "Service names, prices and durations are illustrative.",
              ]} />
            </div>
            <div>
              <SubHead>Fictional demo figures</SubHead>
              <Bullets items={[
                "Every patient, appointment, message, payment and post is invented.",
                "Totals, utilisation and funnel numbers come from that fictional data, not from the clinic.",
              ]} />
            </div>
          </div>
        </Panel>
      </Grid>
    </Page>
  );
}

/* ── People & permissions ───────────────────────────────────────────────── */
const PERSON_TONE: Record<F.PersonState, Tone> = { Active: "ok", Planned: "warn", "Not invited": "neutral" };

type Level = "Full" | "Own only" | "Pack only" | "None";
const LEVEL_TONE: Record<Level, Tone> = { Full: "ok", "Own only": "accent", "Pack only": "outline", None: "neutral" };
const MATRIX: { cap: string; owner: [Level, string]; prac: [Level, string]; acc: [Level, string] }[] = [
  { cap: "Diary and bookings", owner: ["Full", "All diaries"], prac: ["Own only", "Own diary only"], acc: ["None", "No access"] },
  { cap: "Patient records", owner: ["Full", "All patients"], prac: ["Own only", "Own patients only"], acc: ["None", "Never"] },
  { cap: "Messages and drafts", owner: ["Full", "Approves every send"], prac: ["Own only", "Own patients' threads"], acc: ["None", "No access"] },
  { cap: "Finance and receipts", owner: ["Full", "Full"], prac: ["None", "No finance"], acc: ["Pack only", "Read-only export"] },
  { cap: "Accountant pack", owner: ["Full", "Prepares and shares"], prac: ["None", "No access"], acc: ["Pack only", "Accountant pack only"] },
  { cap: "Marketing and content", owner: ["Full", "Approves every post"], prac: ["None", "No access"], acc: ["None", "No access"] },
  { cap: "Agents and settings", owner: ["Full", "Full"], prac: ["None", "No access"], acc: ["None", "No access"] },
];

function People() {
  const activeCount = F.PEOPLE.filter((p) => p.state === "Active").length;
  const cols: Column<F.Person>[] = [
    { key: "name", label: "Person", render: (p) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={p.name} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "var(--ink)", fontWeight: 600 }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{p.role}</div>
        </div>
      </div>
    ) },
    { key: "state", label: "State", render: (p) => <Badge tone={PERSON_TONE[p.state]}>{p.state}</Badge> },
    { key: "access", label: "Access", render: (p) => p.access },
    { key: "note", label: "Note", hideSm: true, render: (p) => <span style={{ color: "var(--dim)" }}>{p.note}</span> },
  ];
  const cell = ([lvl, text]: [Level, string]) => <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><Badge tone={LEVEL_TONE[lvl]}>{lvl}</Badge><span className="c-hide-sm" style={{ fontSize: 11.5, color: "var(--dim)" }}>{text}</span></span>;
  const mcols: Column<(typeof MATRIX)[number]>[] = [
    { key: "cap", label: "Area", strong: true, render: (r) => r.cap },
    { key: "owner", label: "Owner", render: (r) => cell(r.owner) },
    { key: "prac", label: "Planned practitioner", render: (r) => cell(r.prac) },
    { key: "acc", label: "External accountant", render: (r) => cell(r.acc) },
  ];
  return (
    <Page>
      <Panel title="People" meta={plural(activeCount, "active user") + " · planned roles are not counted as employees"} flush>
        <Table columns={cols} rows={F.PEOPLE} rowKey={(p) => p.id} />
      </Panel>
      <Panel title="Proposed permissions" meta="Proposal for discussion" flush>
        <Table columns={mcols} rows={MATRIX} rowKey={(r) => r.cap} />
      </Panel>
      <Note>
        These roles are proposals. Deborah is the only active user. Planned roles are not employees and are not counted as staff:
        Emma Byrne is a fictional placeholder for the prospective practitioner and has no account. This demo cannot create accounts, send invitations or change sign-in and authentication.
      </Note>
    </Page>
  );
}

/* ── Systems ────────────────────────────────────────────────────────────── */
const INT_TONE: Record<F.IntegrationState, Tone> = {
  "Simulated in demo": "accent",
  "Manual import preview": "outline",
  "Planned, not connected": "neutral",
  "Awaiting confirmation": "warn",
  "Optional demo channel": "outline",
  "Demo only": "neutral",
};
function Systems() {
  const cols: Column<F.Integration>[] = [
    { key: "name", label: "System", strong: true, render: (i) => i.name },
    { key: "evidence", label: "What we know", render: (i) => i.evidence },
    { key: "state", label: "State", render: (i) => <Badge tone={INT_TONE[i.state]}>{i.state}</Badge> },
    { key: "pres", label: "In this demo", hideSm: true, render: (i) => <span style={{ color: "var(--dim)" }}>{i.presentation}</span> },
  ];
  return (
    <Page>
      <Panel title="Systems" meta="None are connected" flush>
        <Table columns={cols} rows={F.INTEGRATIONS} rowKey={(i) => i.id} />
      </Panel>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)">
        <Panel title="Mentioned, not installed">
          <Bullets items={[
            "Bora and Aura were discussed as possible clinic software vendors only. Neither is installed or connected.",
            "ChatGPT is Deborah's personal tool. Pulse has no access to those conversations.",
          ]} />
        </Panel>
        <Panel title="Demo limitations">
          <Bullets items={[
            "Nothing leaves Pulse: no message is sent, no post is published, no money moves.",
            "Imports are sample files built for the demo, not a live feed.",
            "Changes are saved only in this browser and can be reset in Experience.",
            "There are no user accounts or sign-in in the demo.",
            "All patients, payments and figures are fictional.",
          ]} />
        </Panel>
      </Grid>
    </Page>
  );
}

/* ── Governance ─────────────────────────────────────────────────────────── */
function Governance({ s }: { s: ClinicState }) {
  const pending = approvals(s);
  const count = (types: string[]) => pending.filter((a) => types.includes(a.type)).length;
  const rules: { id: string; action: string; proposer: string; rule: string; n: number; open: () => void }[] = [
    { id: "msg", action: "Sending a message", proposer: "Inbox Assistant", rule: "Deborah approves every reply. Approved replies are marked sent in demo.", n: count(["Message draft"]), open: () => go("Inbox", "drafts") },
    { id: "book", action: "Booking change from an offer", proposer: "Booking Agent", rule: "Deborah approves the offer; the slot is only booked when the patient says yes.", n: count(["Availability offer"]), open: () => go("Bookings", "waitlist") },
    { id: "rcpt", action: "Allocating a receipt", proposer: "Finance Agent", rule: "Deborah approves each match. A receipt is never allocated twice.", n: count(["Payment match"]), open: () => go("Finance", "transactions") },
    { id: "post", action: "Publishing content", proposer: "Content Assistant", rule: "Deborah approves each post. Approved posts are scheduled in demo only.", n: count(["Content post"]), open: () => go("Marketing", "library") },
  ];
  const rcols: Column<(typeof rules)[number]>[] = [
    { key: "a", label: "Needs Deborah's yes", strong: true, render: (r) => r.action },
    { key: "p", label: "Proposed by", hideSm: true, render: (r) => r.proposer },
    { key: "r", label: "Rule", hideSm: true, render: (r) => <span style={{ color: "var(--dim)" }}>{r.rule}</span> },
    { key: "n", label: "Waiting", num: true, render: (r) => r.n ? <Badge tone="warn">{r.n}</Badge> : <Badge tone="ok">0</Badge> },
    { key: "o", label: "", render: (r) => <Btn size="sm" variant="ghost" onClick={r.open}>Open</Btn> },
  ];
  const acols: Column<F.AgentDef>[] = [
    { key: "n", label: "Agent", strong: true, render: (a) => a.name },
    { key: "d", label: "Data it may read", render: (a) => <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{a.permittedData.map((d) => <Badge key={d} tone="outline">{d}</Badge>)}</div> },
    { key: "s", label: "Status", render: (a) => s.agentsPaused[a.id] ? <Badge tone="warn">Paused</Badge> : <Badge tone="ok">Active</Badge> },
  ];
  const audit = activity(s).slice(0, 8);
  return (
    <Page>
      <Panel title="Approval controls" meta={pending.length + " waiting in total"} flush>
        <Table columns={rcols} rows={rules} rowKey={(r) => r.id} />
      </Panel>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)">
        <Panel title="Data access by agent" meta={s.settings.allowMarketingUsePatientData ? "Marketing use of patient data: on (demo)" : "Patient records never used for marketing"} flush>
          <Table columns={acols} rows={F.AGENTS} rowKey={(a) => a.id} />
        </Panel>
        <Panel title="Audit preview" meta="Latest 8 events" flush actions={<Btn size="sm" variant="ghost" onClick={() => go("Activity", "all")}>All activity</Btn>}>
          <div className="c-list">
            {audit.map((e) => (
              <div className="c-li" key={e.id} style={{ alignItems: "flex-start" }}>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--dim)", width: 92, flex: "none" }}>{relDay(e.at.slice(0, 10))} {e.at.slice(11, 16)}</span>
                <div className="grow">
                  <div className="t" style={{ fontWeight: 400, lineHeight: 1.5 }}>{e.text}</div>
                  <div className="s">{e.actor} · {e.kind}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Grid>
    </Page>
  );
}

/* ── AI controls ────────────────────────────────────────────────────────── */
function AiControls({ s }: { s: ClinicState }) {
  const st = s.settings;
  return (
    <Page>
      <Grid cols="minmax(0,1.3fr) minmax(0,1fr)">
        <Panel title="AI controls" meta="Changes are recorded in Activity" flush>
          <div className="c-list">
            <SettingRow k="draftFirst" s={s} title="Draft first">
              Agents prepare drafts; nothing with an effect happens until Deborah approves it.
              {!st.draftFirst && <><br /><span style={{ color: "var(--warn)" }}>Recorded as off. In this demo agents still never send, book, allocate or publish on their own.</span></>}
            </SettingRow>
            <SettingRow k="escalateSensitive" s={s} title="Escalate sensitive topics">
              Clinical questions, medication, side effects and complaints go straight to Deborah with no AI answer.
              {!st.escalateSensitive && <><br /><span style={{ color: "var(--warn)" }}>Recorded as off. Agents in this demo still never answer clinical questions.</span></>}
            </SettingRow>
            <SettingRow k="allowFinanceData" s={s} title="Finance Agent may read transactions">
              Lets the Finance Agent compare receipts with appointment dates and prices to suggest matches.
              {!st.allowFinanceData && <><br /><span style={{ color: "var(--warn)" }}>Off: the Finance Agent would make no new match proposals.</span></>}
            </SettingRow>
            <SettingRow k="allowMarketingUsePatientData" s={s} title="Use patient data for marketing">
              {st.allowMarketingUsePatientData
                ? <span style={{ color: "var(--warn)" }}>On in demo only. The Content Assistant still has no access to patient records or photos; any real use would need each patient's written consent.</span>
                : "Off. Patient records are never used for marketing, targeting or training."}
            </SettingRow>
            <SettingRow k="quietHours" s={s} title="Quiet hours">
              No notifications between 20:00 and 08:00. Agents may prepare drafts overnight; they wait for the morning.
            </SettingRow>
          </div>
        </Panel>
        <Panel title="How the agents behave">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <SubHead>Draft first</SubHead>
              <Bullets items={[
                "Replies, offers, payment matches and posts are drafted and queued.",
                "Deborah approves, edits or rejects each one in Inbox, Bookings, Finance or Marketing.",
                "Approved items are marked sent or scheduled in demo; nothing leaves Pulse.",
              ]} />
            </div>
            <div>
              <SubHead>Sensitive topics</SubHead>
              <Bullets items={[
                "Any clinical question goes to Deborah with no draft and no AI answer.",
                "Agents never diagnose, prescribe, recommend treatment or assess suitability.",
                "Preparation checks are administrative only: forms, documents and contact details.",
              ]} />
            </div>
          </div>
        </Panel>
      </Grid>
    </Page>
  );
}

/* ── Experience ─────────────────────────────────────────────────────────── */
interface ThemeChoice { id: string; label: string; group?: string; active?: boolean; pick?: () => void }

function Experience({ s, v }: { s: ClinicState; v: any }) {
  const [confirming, setConfirming] = useState(false);
  const raw: unknown = v?.themeChoices;
  const themes: ThemeChoice[] = Array.isArray(raw) ? (raw as ThemeChoice[]).filter((t) => t && typeof t.id === "string") : [];
  const groups: { name: string; items: ThemeChoice[] }[] = [];
  for (const t of themes) {
    const name = t.group || "Themes";
    const g = groups.find((x) => x.name === name);
    if (g) g.items.push(t); else groups.push({ name, items: [t] });
  }
  return (
    <Page>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)">
        <Panel title="Theme">
          {groups.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Theme choices are not available in this view.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {groups.map((g) => (
                <div key={g.name}>
                  {groups.length > 1 && <SubHead>{g.name}</SubHead>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {g.items.map((t) => (
                      <Btn key={t.id} size="sm" variant={t.active ? "primary" : "secondary"} onClick={() => t.pick?.()} disabled={!t.pick}>
                        {t.label}
                      </Btn>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Kv items={[["Timezone", s.settings.timezone + " (fixed)"], ["Date format", "dd/mm/yyyy, 24-hour clock"]]} />
          </div>
        </Panel>
        <Panel title="Notifications" meta="In demo only" flush>
          <div className="c-list">
            <SettingRow k="notifyDrafts" s={s} title="New drafts to review">When an agent has a reply, offer or post ready for approval.</SettingRow>
            <SettingRow k="notifyPayments" s={s} title="Payments to match">When received payments are waiting for allocation.</SettingRow>
            <SettingRow k="notifyPrep" s={s} title="Preparation checks">When an upcoming appointment is missing a form or document.</SettingRow>
            <SettingRow k="dailyBriefing" s={s} title="Daily briefing">A short morning summary on Home at 08:00.</SettingRow>
          </div>
        </Panel>
      </Grid>
      <Panel title="Reset demo">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px", fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>
            {confirming
              ? "This restores every fictional record to its starting point and clears this browser's saved demo state, including this session's activity. Continue?"
              : "Start the demo again from the Tue 10 Nov snapshot."}
          </div>
          {confirming ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setConfirming(false)}>Cancel</Btn>
              <Btn variant="danger" onClick={() => { reset(); setConfirming(false); }}>Yes, reset demo</Btn>
            </div>
          ) : (
            <Btn onClick={() => setConfirming(true)}>Reset demo</Btn>
          )}
        </div>
      </Panel>
    </Page>
  );
}
