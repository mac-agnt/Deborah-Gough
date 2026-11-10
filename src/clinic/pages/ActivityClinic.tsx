/* Activity: one feed of everything that happened in the demo clinic. Seed
   events (fixtures) plus this session's events from the store, newest first.
   The top-bar tab picks the kind; area and search narrow it further. */

import { useMemo, useState } from "react";
import type * as F from "../fixtures";
import { useClinic, go } from "../store";
import { activity } from "../selectors";
import { SNAPSHOT, addDays, dayLong, plural } from "../format";
import { Page, Grid, Panel, Badge, Btn, Search, Note, Empty, type Tone } from "../ui";

const KIND_BY_TAB: Record<string, F.ActivityKind | undefined> = {
  imported: "Imported",
  agent: "Agent proposal",
  user: "Your action",
};
const KIND_TONE: Record<F.ActivityKind, Tone> = {
  Imported: "outline",
  "Agent proposal": "accent",
  "Your action": "ok",
  System: "neutral",
};
const AREAS = ["Clinical", "Administration", "Marketing", "Finance", "Bookings"] as const;

function dayHeading(iso: string): string {
  if (iso === SNAPSHOT.date) return "Today, " + dayLong(iso);
  if (iso === addDays(SNAPSHOT.date, -1)) return "Yesterday, " + dayLong(iso);
  return dayLong(iso);
}

export default function ActivityClinic({ tab }: { tab: string; v: any }) {
  const s = useClinic();
  const [area, setArea] = useState<string>("all");
  const [q, setQ] = useState("");

  const all = useMemo(() => activity(s), [s]);
  const kind = KIND_BY_TAB[tab];
  const sessionCount = s.events.length;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((e) =>
      (!kind || e.kind === kind) &&
      (area === "all" || e.area === area) &&
      (!needle || (e.text + " " + e.actor + " " + e.area).toLowerCase().includes(needle)));
  }, [all, kind, area, q]);

  const groups = useMemo(() => {
    const out: { date: string; items: F.ActivityEvent[] }[] = [];
    for (const e of rows) {
      const d = e.at.slice(0, 10);
      const last = out[out.length - 1];
      if (last && last.date === d) last.items.push(e);
      else out.push({ date: d, items: [e] });
    }
    return out;
  }, [rows]);

  const counts = useMemo(() => {
    const c: Record<F.ActivityKind, number> = { Imported: 0, "Agent proposal": 0, "Your action": 0, System: 0 };
    for (const e of all) c[e.kind] += 1;
    return c;
  }, [all]);

  const filtered = area !== "all" || q.trim() !== "";

  return (
    <Page>
      <Note>
        Every event here is a fictional demo event. New ones appear as you act in the demo
        ({sessionCount ? plural(sessionCount, "event") + " from this session so far" : "none from this session yet"}).
      </Note>
      <Grid cols="minmax(0,1fr) minmax(240px,300px)">
        <Panel title="Activity" meta={plural(rows.length, "event")} flush
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select className="c-select" aria-label="Filter by area" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: 160, height: 30 }}>
                <option value="all">All areas</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <Search value={q} onChange={setQ} placeholder="Search activity" />
            </div>
          }>
          {groups.length === 0 ? (
            <Empty title="No matching events"
              action={filtered ? <Btn size="sm" onClick={() => { setArea("all"); setQ(""); }}>Clear filters</Btn> : undefined}>
              {filtered ? "Try another area or search term." : "Nothing of this kind yet. Act in the demo and it will show here."}
            </Empty>
          ) : groups.map((g) => (
            <div key={g.date}>
              <div style={{ padding: "8px 18px", fontSize: 11.5, fontWeight: 600, color: "var(--dim)", background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                {dayHeading(g.date)}
              </div>
              <div className="c-list">
                {g.items.map((e) => (
                  <div className="c-li" key={e.id} style={{ alignItems: "flex-start" }}>
                    <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--dim)", width: 40, flex: "none", paddingTop: 1 }}>{e.at.slice(11, 16)}</span>
                    <div className="grow">
                      <div className="t" style={{ fontWeight: 400, lineHeight: 1.5 }}>{e.text}</div>
                      <div className="s" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <Badge tone={KIND_TONE[e.kind]}>{e.kind}</Badge>
                        <span>{e.actor}</span>
                        <span aria-hidden="true">·</span>
                        <span>{e.area}</span>
                      </div>
                    </div>
                    {e.link && (
                      <Btn size="sm" variant="ghost" onClick={() => go(e.link!.page, e.link!.tab, e.link!.id)} title={"Open in " + e.link.page}>Open</Btn>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="What the kinds mean">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}><Badge tone="outline">Imported</Badge><span style={{ color: "var(--dim)" }}>{counts.Imported}</span></div>
              Sample records loaded into the demo, such as a Revolut CSV or a calendar preview. Fixtures, not a live feed.
            </div>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}><Badge tone="accent">Agent proposal</Badge><span style={{ color: "var(--dim)" }}>{counts["Agent proposal"]}</span></div>
              Something an agent prepared or suggested. Nothing with an effect happens until Deborah approves it.
            </div>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}><Badge tone="ok">Your action</Badge><span style={{ color: "var(--dim)" }}>{counts["Your action"]}</span></div>
              Deborah's own decisions: approvals, bookings, allocations and settings changes.
            </div>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}><Badge>System</Badge><span style={{ color: "var(--dim)" }}>{counts.System}</span></div>
              Automatic routing, such as a clinical question passed to Deborah with no draft. Shown under Everything.
            </div>
          </div>
        </Panel>
      </Grid>
    </Page>
  );
}
