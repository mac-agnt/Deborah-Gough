/* Agents module: Runs (what each agent did, the evidence it used and what it
   proposes) and Controls (what each agent may touch, what it never does, and
   a pause switch). The Overview tab is the existing chat page, not this file.
   Every approval here calls the same store action the owning queue uses, so
   Inbox, Finance, Work and Activity stay in step. */

import { useEffect, useMemo, useRef, useState } from "react";
import * as F from "../fixtures";
import { useClinic, go, takeFocus, toast, approveDraft, rejectDraft, matchReceipt, rejectProposal, toggleAgent, type ClinicState } from "../store";
import { runApproval, inboxCounts, postsAwaiting } from "../selectors";
import { relDay, plural } from "../format";
import { Page, Grid, Panel, Badge, Btn, Table, Toggle, Note, Kv, Empty, type Tone, type Column } from "../ui";

const AGENT_BY_ID: Record<F.AgentId, F.AgentDef> = Object.fromEntries(F.AGENTS.map((a) => [a.id, a])) as Record<F.AgentId, F.AgentDef>;
const RUNS_NEWEST = [...F.AGENT_RUNS].sort((a, b) => b.at.localeCompare(a.at));

function when(at: string): string {
  const [d, t] = at.split(" ");
  return relDay(d) + ", " + t;
}
function approvalTone(a: F.RunApproval): Tone {
  return a === "Awaiting approval" ? "warn" : a === "Approved" ? "ok" : a === "Rejected" ? "bad" : "neutral";
}
function lastRun(agent: F.AgentId): F.AgentRun | undefined {
  return RUNS_NEWEST.find((r) => r.agent === agent);
}

export default function AgentsClinic({ tab }: { tab: string; v: any }) {
  const s = useClinic();
  const [agentFilter, setAgentFilter] = useState<F.AgentId | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  // Deep links: go("Agents", "runs", "RUN-03") opens a run; an agent id filters the list.
  useEffect(() => {
    const id = takeFocus("Agents");
    if (!id) return;
    if (id.startsWith("RUN-")) { setAgentFilter("all"); setSelected(id); }
    else if (id in AGENT_BY_ID) { setAgentFilter(id as F.AgentId); setSelected(null); }
  }, [tab]);

  // Set locally (same instance) and pass as focus id (in case the shell remounts the page).
  const showRuns = (agent: F.AgentId) => { setAgentFilter(agent); setSelected(null); go("Agents", "runs", agent); };

  if (tab === "controls") return <Controls s={s} onRuns={showRuns} />;
  return <Runs s={s} agentFilter={agentFilter} setAgentFilter={(a) => { setAgentFilter(a); setSelected(null); }} selected={selected} setSelected={setSelected} />;
}

/* ── Runs ───────────────────────────────────────────────────────────────── */
function Runs({ s, agentFilter, setAgentFilter, selected, setSelected }: {
  s: ClinicState; agentFilter: F.AgentId | "all"; setAgentFilter: (a: F.AgentId | "all") => void; selected: string | null; setSelected: (id: string) => void;
}) {
  const detailRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => RUNS_NEWEST.filter((r) => agentFilter === "all" || r.agent === agentFilter), [agentFilter]);
  const awaiting = rows.filter((r) => runApproval(s, r) === "Awaiting approval").length;
  const current = rows.find((r) => r.id === selected) || rows.find((r) => runApproval(s, r) === "Awaiting approval") || rows[0];

  const pick = (r: F.AgentRun) => {
    setSelected(r.id);
    if (typeof window !== "undefined" && window.innerWidth < 980) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const columns: Column<F.AgentRun>[] = [
    { key: "at", label: "When", width: "120px", render: (r) => <span style={{ whiteSpace: "nowrap" }}>{when(r.at)}</span> },
    { key: "agent", label: "Agent", hideSm: true, render: (r) => AGENT_BY_ID[r.agent].name },
    { key: "title", label: "Run", strong: true, render: (r) => r.title },
    { key: "ap", label: "Approval", render: (r) => { const a = runApproval(s, r); return <Badge tone={approvalTone(a)}>{a}</Badge>; } },
  ];

  return (
    <Page>
      <Grid cols="minmax(0,1.15fr) minmax(0,1fr)">
        <Panel title="Agent runs" meta={plural(rows.length, "run") + " · " + awaiting + " awaiting approval"} flush
          actions={
            <select className="c-select" aria-label="Filter by agent" value={agentFilter} style={{ width: 190, height: 30 }}
              onChange={(e) => setAgentFilter(e.target.value as F.AgentId | "all")}>
              <option value="all">All agents</option>
              {F.AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          }>
          <Table columns={columns} rows={rows} rowKey={(r) => r.id} onRow={pick} selected={current?.id ?? null}
            empty={<Empty title="No runs for this agent">Pick another agent or show all agents.</Empty>} />
        </Panel>
        <div ref={detailRef} style={{ minWidth: 0 }}>
          {current ? <RunDetail s={s} run={current} /> : <Panel title="Run detail"><Empty title="Nothing selected">Choose a run to see its evidence and proposed action.</Empty></Panel>}
        </div>
      </Grid>
    </Page>
  );
}

function RunDetail({ s, run }: { s: ClinicState; run: F.AgentRun }) {
  const agent = AGENT_BY_ID[run.agent];
  const approval = runApproval(s, run);
  const paused = !!s.agentsPaused[run.agent];
  const awaiting = approval === "Awaiting approval";

  let actions: JSX.Element | null = null;
  if (run.id === "RUN-02") {
    const conv = s.conversations.find((c) => c.id === "CONV-01");
    const can = awaiting && !!conv && conv.state === "Open" && conv.draftState === "Ready";
    actions = (
      <>
        <Btn variant="primary" disabled={!can} onClick={() => { const r = approveDraft("CONV-01"); if (!r.ok) toast(r.error); }}>Approve offer to Aoife</Btn>
        <Btn disabled={!can} onClick={() => { rejectDraft("CONV-01"); toast("Offer rejected. Aoife's conversation moved to your personal review."); }}>Reject</Btn>
        <Btn variant="ghost" onClick={() => go("Inbox", "drafts", "CONV-01")}>Edit draft in Inbox</Btn>
      </>
    );
  } else if (run.id === "RUN-03") {
    const tx = s.transactions.find((t) => t.id === F.PROPOSED_MATCH_TX);
    const can = awaiting && !!tx && !tx.matched && tx.proposedPatientId === "PAT-072";
    actions = (
      <>
        <Btn variant="primary" disabled={!can} onClick={() => {
          const r = matchReceipt(F.PROPOSED_MATCH_TX, "PAT-072", tx?.proposedAppointmentId);
          toast(r.ok ? "Allocated €180 to Niamh Kelly in demo. No money moved." : r.error);
        }}>Approve allocation</Btn>
        <Btn disabled={!can} onClick={() => { rejectProposal(F.PROPOSED_MATCH_TX); toast("Proposal rejected. The receipt stays in the queue."); }}>Reject</Btn>
      </>
    );
  } else if (run.id === "RUN-04") {
    const n = inboxCounts(s).drafts;
    actions = <Btn variant={n ? "primary" : "secondary"} onClick={() => go("Inbox", "drafts")}>{n ? "Review " + plural(n, "draft") : "Open drafts"}</Btn>;
  } else if (run.id === "RUN-07") {
    const n = postsAwaiting(s).length;
    actions = <Btn variant={n ? "primary" : "secondary"} onClick={() => go("Marketing", "library")}>{n ? "Review " + plural(n, "post") : "Open content library"}</Btn>;
  }

  return (
    <Panel title={run.title} meta={run.id}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Kv items={[
          ["Agent", <span key="a">{agent.name}{paused && <> <Badge tone="warn">Paused</Badge></>}</span>],
          ["Ran", when(run.at)],
          ["Approval", <Badge key="b" tone={approvalTone(approval)}>{approval}</Badge>],
          ["Boundary", agent.boundary],
        ]} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Input evidence at run time</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--body)", lineHeight: 1.7 }}>
            {run.evidence.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Proposed action</div>
          <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.6 }}>{run.proposed}</div>
        </div>
        {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
        {awaiting && (run.id === "RUN-02" || run.id === "RUN-03") && (
          <Note>Nothing happens until you approve. Approving marks it done in the demo only: no message is sent and no money moves.</Note>
        )}
        {run.links.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Related records</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {run.links.map((l) => <Btn key={l.label} size="sm" variant="ghost" onClick={() => go(l.page, l.tab, l.id)}>{l.label}</Btn>)}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ── Controls ───────────────────────────────────────────────────────────── */
function Controls({ s, onRuns }: { s: ClinicState; onRuns: (a: F.AgentId) => void }) {
  const active = F.AGENTS.filter((a) => !s.agentsPaused[a.id]).length;
  const columns: Column<F.AgentDef>[] = [
    { key: "name", label: "Agent", render: (a) => (
      <div style={{ minWidth: 160 }}>
        <div style={{ color: "var(--ink)", fontWeight: 600 }}>{a.name}</div>
        <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{a.responsibility}</div>
      </div>
    ) },
    { key: "boundary", label: "Approval boundary", render: (a) => a.boundary },
    { key: "data", label: "Permitted data", hideSm: true, render: (a) => (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{a.permittedData.map((d) => <Badge key={d} tone="outline">{d}</Badge>)}</div>
    ) },
    { key: "never", label: "Never does", hideSm: true, render: (a) => (
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.6 }}>{a.neverDoes.map((n) => <li key={n}>{n}</li>)}</ul>
    ) },
    { key: "last", label: "Last run", render: (a) => { const r = lastRun(a.id); return r ? <span style={{ whiteSpace: "nowrap" }}>{when(r.at)}</span> : "None"; } },
    { key: "status", label: "Status", render: (a) => {
      const on = !s.agentsPaused[a.id];
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Toggle checked={on} onChange={() => toggleAgent(a.id)} label={(on ? "Pause " : "Resume ") + a.name} />
          <Badge tone={on ? "ok" : "warn"}>{on ? "Active" : "Paused"}</Badge>
        </div>
      );
    } },
    { key: "runs", label: "", render: (a) => <Btn size="sm" variant="ghost" onClick={() => onRuns(a.id)}>Runs</Btn> },
  ];

  return (
    <Page>
      <Note>
        Agents never diagnose, prescribe or answer clinical questions on their own, and patient records are never used to train or target marketing.
        Anything with an effect (a message, a booking change, a payment allocation, a post) is drafted first and waits for Deborah's approval.
        Clinical questions go straight to Deborah with no AI answer.
      </Note>
      <Panel title="Agent controls" meta={active + " of " + F.AGENTS.length + " active"} flush>
        <Table columns={columns} rows={F.AGENTS} rowKey={(a) => a.id} />
      </Panel>
    </Page>
  );
}
