/* Marketing: content planning, approvals and local growth for the clinic.
   Everything here is simulated. Approving a post schedules it in the demo
   only; nothing is posted to Instagram and no paid campaign is launched. */

import { useEffect, useMemo, useState } from "react";
import * as F from "../fixtures";
import { useClinic, useUi, go, takeFocus, toast, editCaption, setPostTime, approvePost, returnPostToDraft } from "../store";
import type { ClinicState } from "../store";
import { localShare, funnel, postsAwaiting, apptsOn, patientOf } from "../selectors";
import { SNAPSHOT, dayLabel, dayLong, addDays, eur, toMin, plural } from "../format";
import { Page, Grid, Panel, Badge, Btn, Drawer, Tabs, Field, Note, Kv, BarList, Stats, Stat, Progress, DemoTag, Empty } from "../ui";
import type { Tone } from "../ui";

/* ── helpers ───────────────────────────────────────────────────────────── */
const STATUS_TONE: Record<F.PostStatus, Tone> = {
  Published: "ok",
  "Awaiting approval": "warn",
  "Scheduled in demo": "accent",
  Draft: "neutral",
};
const STATUS_ORDER: F.PostStatus[] = ["Awaiting approval", "Scheduled in demo", "Draft", "Published"];

function isLightTint(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}
function Thumb({ post, size = 64 }: { post: F.Post; size?: number }) {
  // Text colour on light tints reuses a fixture tint so the label stays readable.
  return (
    <div className="c-post-thumb" aria-hidden="true"
      style={{ background: post.tint, width: size, height: size, color: isLightTint(post.tint) ? "#243735" : undefined, boxShadow: "inset 0 0 0 1px var(--border)" }}>
      {post.format}
    </div>
  );
}
const sortPosts = (a: F.Post, b: F.Post) => (a.date + a.time).localeCompare(b.date + b.time);
const isPast = (date: string, time: string) => date < SNAPSHOT.date || (date === SNAPSHOT.date && toMin(time) <= toMin(SNAPSHOT.time));
const canEdit = (p: F.Post) => p.status !== "Published";

/* ── shared post editor (library pane and planner drawer) ──────────────── */
function PostEditor({ post, onDone }: { post: F.Post; onDone?: () => void }) {
  const [caption, setCaption] = useState(post.caption);
  const [date, setDate] = useState(post.date);
  const [time, setTime] = useState(post.time);
  const [error, setError] = useState<string | null>(null);
  const editable = canEdit(post) && post.status !== "Scheduled in demo";
  const dirty = caption !== post.caption || date !== post.date || time !== post.time;
  const capId = "cap-" + post.id, dateId = "date-" + post.id, timeId = "time-" + post.id;

  const save = (): boolean => {
    if (!caption.trim()) { setError("Add a caption before saving."); return false; }
    if (!date || !time) { setError("Choose a date and time."); return false; }
    if (isPast(date, time)) { setError("Pick a time after " + SNAPSHOT.label + "."); return false; }
    setError(null);
    if (caption !== post.caption) editCaption(post.id, caption.trim());
    if (date !== post.date || time !== post.time) setPostTime(post.id, date, time);
    return true;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="c-post">
        <Thumb post={post} size={88} />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge tone={STATUS_TONE[post.status]}>{post.status}</Badge>
            <Badge tone="outline">{post.topic}</Badge>
            <Badge tone="outline">{post.format}</Badge>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{caption || <span style={{ color: "var(--faint)" }}>No caption yet.</span>}</div>
          <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{dayLong(date)} at {time}</div>
        </div>
      </div>

      {post.status === "Published" ? (
        <Note>This post is part of the fictional posting history. It is shown for context and cannot be edited.</Note>
      ) : (
        <>
          <Field label="Caption" htmlFor={capId} hint={caption.length + " characters. Clinic-led content only: no patient names, photos or records."}>
            <textarea id={capId} className="c-textarea" value={caption} disabled={!editable} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <Grid cols="1fr 1fr" style={{ gap: 10 }}>
            <Field label="Date" htmlFor={dateId}>
              <input id={dateId} type="date" className="c-input" value={date} min={SNAPSHOT.date} disabled={!editable} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Time" htmlFor={timeId}>
              <input id={timeId} type="time" className="c-input" value={time} step={300} disabled={!editable} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </Grid>
          {error && <div className="c-field"><span className="err" role="alert">{error}</span></div>}
          {post.status === "Scheduled in demo" && (
            <Note>Scheduled in demo for {dayLabel(post.date)} at {post.time}. Nothing was posted to Instagram. Return it to draft to change the caption or time.</Note>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {post.status === "Scheduled in demo" ? (
              <Btn onClick={() => { returnPostToDraft(post.id); toast("Returned to draft. It is back in the approval queue."); }}>Return to draft</Btn>
            ) : (
              <>
                <Btn disabled={!dirty} onClick={() => { if (save()) toast("Changes saved in demo."); }}>Save changes</Btn>
                <Btn variant="primary" onClick={() => { if (save()) { approvePost(post.id); onDone?.(); } }}>Approve and schedule in demo</Btn>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PostDrawer({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  const s = useClinic();
  const post = postId ? s.posts.find((p) => p.id === postId) : undefined;
  return (
    <Drawer open={!!post} onClose={onClose} title={post?.title || "Post"} sub={post ? post.topic + ", " + dayLabel(post.date) + " " + post.time : undefined}>
      {post && <PostEditor key={post.id + post.status} post={post} />}
    </Drawer>
  );
}

/* ── tabs ──────────────────────────────────────────────────────────────── */
function Overview({ s, openPost }: { s: ClinicState; openPost: (id: string) => void }) {
  const ls = localShare(s);
  const fn = funnel(s);
  const awaiting = postsAwaiting(s);
  const counts = STATUS_ORDER.map((st) => ({ st, n: s.posts.filter((p) => p.status === st).length }));
  const upcoming = s.posts.filter((p) => !isPast(p.date, p.time)).sort(sortPosts);
  const camp = F.CAMPAIGNS[0];
  const conv = (a: number, b: number) => (a ? Math.round((b / a) * 100) : 0);

  return (
    <>
      <Grid cols="1.35fr 1fr">
        <Panel title="Content readiness" meta={plural(awaiting.length, "post") + " awaiting approval"}
          actions={<Btn size="sm" variant="primary" onClick={() => go("Marketing", "library")} disabled={!awaiting.length}>Review posts</Btn>} flush>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 18px 12px" }}>
            {counts.map((c) => <Badge key={c.st} tone={STATUS_TONE[c.st]}>{c.st}: {c.n}</Badge>)}
          </div>
          <div className="c-list">
            {upcoming.length ? upcoming.map((p) => (
              <button key={p.id} type="button" className="c-li" onClick={() => openPost(p.id)}>
                <Thumb post={p} size={36} />
                <div className="grow">
                  <div className="t c-ellipsis">{p.title}</div>
                  <div className="s">{dayLabel(p.date)} {p.time} · {p.format}</div>
                </div>
                <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
              </button>
            )) : <Empty title="Nothing upcoming">Plan a post in the planner.</Empty>}
          </div>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Panel title="Local patient share" meta="This week, new patients">
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{ls.pct}%</span>
              <span style={{ fontSize: 12.5, color: "var(--body)" }}>{ls.local} of {ls.newPatients} new patients live in the five target areas</span>
            </div>
            <div style={{ margin: "10px 0 8px" }}><Progress value={ls.local} max={ls.newPatients} label="Local share of new patients" /></div>
            <Btn size="sm" variant="ghost" onClick={() => go("Marketing", "local")}>See localities</Btn>
          </Panel>

          <Panel title="Paid campaign" meta={<Badge tone="outline">{camp.status}</Badge>}>
            <Kv items={[
              ["Campaign", camp.name],
              ["Spent", eur(camp.spent) + " (nothing launched)"],
              ["Areas", camp.areas.join(", ")],
              ["Radius", camp.radiusKm + " km"],
            ]} />
            <div style={{ marginTop: 10 }}><Btn size="sm" onClick={() => go("Marketing", "local")}>Review draft settings</Btn></div>
          </Panel>
        </div>
      </Grid>

      <Panel title="Weekly enquiry to booking funnel" meta={<DemoTag>Fictional attributed events, not verified Instagram analytics</DemoTag>}>
        <Grid cols="1.4fr 1fr">
          <BarList items={fn.map((f) => ({ label: f.stage, value: f.value }))} />
          <div className="c-list" style={{ fontSize: 12.5 }}>
            <div className="c-li" style={{ padding: "6px 0" }}><span className="grow">Enquiry to booking-link open</span><strong>{conv(fn[0].value, fn[1].value)}%</strong></div>
            <div className="c-li" style={{ padding: "6px 0" }}><span className="grow">Link open to new-patient booking</span><strong>{conv(fn[1].value, fn[2].value)}%</strong></div>
            <div className="c-li" style={{ padding: "6px 0" }}><span className="grow">Enquiry to new-patient booking</span><strong>{conv(fn[0].value, fn[2].value)}%</strong></div>
          </div>
        </Grid>
        <div style={{ marginTop: 10 }}><Note>New-patient bookings come from this week's appointments, so the last step moves when bookings change. Enquiries and link opens are fixed demo counts.</Note></div>
      </Panel>
    </>
  );
}

type WeekKey = "last" | "this" | "next";
const WEEK_START: Record<WeekKey, string> = { last: "2026-11-02", this: "2026-11-09", next: "2026-11-16" };

function Planner({ s, openPost }: { s: ClinicState; openPost: (id: string) => void }) {
  const [wk, setWk] = useState<WeekKey>("this");
  const days = Array.from({ length: 7 }, (_, i) => addDays(WEEK_START[wk], i));
  const inWeek = s.posts.filter((p) => days.includes(p.date)).sort(sortPosts);
  const range = dayLabel(days[0]) + " to " + dayLabel(days[6]);
  const items = (["last", "this", "next"] as WeekKey[]).map((k) => {
    const ds = Array.from({ length: 7 }, (_, i) => addDays(WEEK_START[k], i));
    return { id: k, label: k === "last" ? "Last week" : k === "this" ? "This week" : "Next week", count: s.posts.filter((p) => ds.includes(p.date)).length };
  });

  return (
    <Panel title="Content calendar" meta={range + " · " + plural(inWeek.length, "post")} actions={<Tabs items={items} value={wk} onChange={setWk} />}>
      <div className="c-grid" style={{ gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 8 }}>
        {days.map((d) => {
          const list = inWeek.filter((p) => p.date === d);
          const clinicDay = F.CLINIC_DAYS.includes(d);
          return (
            <div key={d} className="c-cal-day" style={{ background: d === SNAPSHOT.date ? "var(--accent-faint)" : undefined }}>
              <h4>
                <span>{dayLabel(d)}</span>
                {d === SNAPSHOT.date && <Badge tone="accent">Today</Badge>}
                {clinicDay && d !== SNAPSHOT.date && <span style={{ fontSize: 10.5, fontWeight: 500, color: "var(--faint)" }}>Clinic</span>}
              </h4>
              {list.length ? list.map((p) => (
                <button key={p.id} type="button" className="c-slot" style={{ flexDirection: "column", alignItems: "flex-start", gap: 5 }} onClick={() => openPost(p.id)}>
                  <span style={{ display: "flex", gap: 7, alignItems: "center", width: "100%" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: p.tint, flex: "none", boxShadow: "inset 0 0 0 1px var(--border)" }} />
                    <span className="tm" style={{ width: "auto" }}>{p.time}</span>
                    <span style={{ color: "var(--faint)", fontSize: 11 }}>{p.format}</span>
                  </span>
                  <span style={{ color: "var(--ink)", fontWeight: 500, lineHeight: 1.3 }}>{p.title}</span>
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                </button>
              )) : <div style={{ padding: "10px 12px", fontSize: 11.5, color: "var(--faint)" }}>Nothing planned</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}><Note>Click a post to edit its caption or time and approve it. Approved posts are scheduled in demo only; nothing is posted to Instagram.</Note></div>
    </Panel>
  );
}

function Library({ s, selected, setSelected }: { s: ClinicState; selected: string | null; setSelected: (id: string) => void }) {
  const list = s.posts.filter((p) => p.status !== "Published").sort((a, b) => {
    const r = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    return r || sortPosts(a, b);
  });
  const current = list.find((p) => p.id === selected) || list[0];
  const awaiting = postsAwaiting(s).length;

  return (
    <>
      <Grid cols="minmax(0,1fr) minmax(0,1.25fr)">
        <Panel title="Approval queue" meta={plural(awaiting, "post") + " awaiting approval"} flush>
          {list.length ? (
            <div className="c-list">
              {list.map((p) => (
                <button key={p.id} type="button" className="c-li" onClick={() => setSelected(p.id)}
                  aria-pressed={current?.id === p.id} style={current?.id === p.id ? { background: "var(--accent-faint)" } : undefined}>
                  <Thumb post={p} size={44} />
                  <div className="grow">
                    <div className="t c-ellipsis">{p.title}</div>
                    <div className="s">{p.topic} · {dayLabel(p.date)} {p.time}</div>
                  </div>
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                </button>
              ))}
            </div>
          ) : <Empty title="Library is empty">Every post has been handled.</Empty>}
        </Panel>
        <Panel title={current ? current.title : "Post"} meta={current ? current.id : undefined}>
          {current ? <PostEditor key={current.id + current.status} post={current} /> : <Empty title="Nothing selected" />}
        </Panel>
      </Grid>
      <Note>
        Topics are personal and clinic-led: meeting Deborah, finding the clinic, behind the scenes, consultation questions and availability.
        Patient names, photos and records are never used in content{s.settings.allowMarketingUsePatientData ? "" : " (patient data for marketing is switched off in Settings)"}.
      </Note>
    </>
  );
}

function LocalGrowth({ s }: { s: ClinicState }) {
  const ls = localShare(s);
  const camp = F.CAMPAIGNS[0];
  const [areas, setAreas] = useState<string[]>(camp.areas);
  const [radius, setRadius] = useState<number>(camp.radiusKm);
  const linked = s.posts.filter((p) => p.campaignId === camp.id);
  const toggleArea = (a: string) => setAreas((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));

  return (
    <>
      <Grid cols="1fr 1fr">
        <Panel title="Target localities" meta={ls.local + " of " + ls.newPatients + " new patients this week (" + ls.pct + "%)"}>
          <BarList items={ls.byLocality.map((b) => ({ label: b.area, value: b.count }))} />
        </Panel>
        <Panel title="Elsewhere" meta={plural(ls.elsewhereTotal, "new patient") + " outside the target areas"} flush>
          {ls.elsewhere.length ? (
            <div className="c-list">
              {ls.elsewhere.map((e) => (
                <div key={e.area} className="c-li"><span className="grow">{e.area}</span><span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{e.count}</span></div>
              ))}
            </div>
          ) : <Empty title="No new patients from elsewhere this week" />}
        </Panel>
      </Grid>

      <Panel title="Organic planning" meta="Instagram posts">
        <Note>Organic posts cannot be geographically targeted. They reach followers and whoever the platform shows them to. Local relevance comes from the topic: finding the clinic in Milltown, the Eurospar landmark, and availability on clinic days.</Note>
      </Panel>

      <Panel tint title="Paid campaign location settings" meta={<span style={{ display: "inline-flex", gap: 6 }}><Badge tone="outline">{camp.status}</Badge><Badge tone="outline">Spent {eur(camp.spent)}</Badge></span>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Kv items={[["Campaign", camp.name], ["Budget", eur(camp.budget) + ", not set"], ["Linked post", linked.length ? linked.map((p) => p.title).join(", ") : "None"]]} />
          <fieldset style={{ border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <legend style={{ fontSize: 12, fontWeight: 500, color: "var(--body)", marginBottom: 6 }}>Areas</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {F.TARGET_AREAS.map((a) => (
                <label key={a} className="c-badge outline" style={{ height: 28, cursor: "pointer", gap: 6 }}>
                  <input type="checkbox" checked={areas.includes(a)} onChange={() => toggleArea(a)} /> {a}
                </label>
              ))}
            </div>
          </fieldset>
          <div style={{ maxWidth: 220 }}>
            <Field label="Radius around each area" htmlFor="camp-radius">
              <select id="camp-radius" className="c-select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {[2, 3, 5, 8, 10].map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            </Field>
          </div>
          <Note>{camp.note} This campaign stays a draft: no budget is set, nothing is spent and nothing launches from Pulse.</Note>
          <div>
            <Btn variant="primary" disabled={!areas.length} onClick={() => toast("Draft settings saved in demo: " + areas.length + " area" + (areas.length === 1 ? "" : "s") + ", " + radius + " km. Nothing launched, €0 spent.")}>Save draft settings</Btn>
          </div>
        </div>
      </Panel>
    </>
  );
}

type Period = "this" | "last";
function Performance({ s }: { s: ClinicState }) {
  const [period, setPeriod] = useState<Period>("this");
  const dates = period === "this" ? F.THIS_WEEK : F.LAST_WEEK;
  const label = period === "this" ? "10 to 13 Nov" : "3 to 6 Nov";
  const data = useMemo(() => {
    const pats = apptsOn(s, dates).filter((a) => a.isNew).map((a) => patientOf(s, a.patientId));
    const sources: F.Source[] = ["Instagram", "Referral", "Website", "Walk-in"];
    const bySource = sources.map((src) => ({ label: src, value: pats.filter((p) => p.source === src).length }));
    const local = F.TARGET_AREAS.map((a) => ({ label: a, value: pats.filter((p) => p.locality === a).length }));
    const elsewhere = pats.filter((p) => !p.targetArea).length;
    return { total: pats.length, bySource, local, elsewhere, localTotal: pats.length - elsewhere };
  }, [s, dates]);
  const top = [...data.bySource].sort((a, b) => b.value - a.value)[0];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Tabs items={[{ id: "this" as Period, label: "This week, 10 to 13 Nov" }, { id: "last" as Period, label: "Last week, 3 to 6 Nov" }]} value={period} onChange={setPeriod} />
        <DemoTag>Fictional attribution</DemoTag>
      </div>
      <Stats>
        <Stat label={"New patients, " + label} value={data.total} />
        <Stat label="From target areas" value={data.localTotal} note={data.total ? Math.round((data.localTotal / data.total) * 100) + "% of new patients" : undefined} />
        <Stat label="Top source" value={top && top.value ? top.label : "None"} note={top && top.value ? plural(top.value, "new patient") : undefined} />
      </Stats>
      <Grid cols="1fr 1fr">
        <Panel title="New patients by source" meta={label}>
          <BarList items={data.bySource} />
        </Panel>
        <Panel title="New patients by locality" meta={label}>
          <BarList items={[...data.local, { label: "Elsewhere", value: data.elsewhere, muted: true }]} />
        </Panel>
      </Grid>
      <Note>Computed from first-visit appointments on the clinic days in the selected week. The source is the first-contact channel recorded on each fictional patient record; it is not verified Instagram analytics.</Note>
    </>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */
export default function Marketing({ tab }: { tab: string; v: any }) {
  const s = useClinic();
  const ui = useUi();
  const [drawer, setDrawer] = useState<string | null>(null);
  const [libSel, setLibSel] = useState<string | null>(null);

  const pendingFocus = ui.focus.Marketing;
  useEffect(() => {
    const id = takeFocus("Marketing");
    if (!id || !s.posts.some((p) => p.id === id)) return;
    if (tab === "library") setLibSel(id);
    else setDrawer(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFocus, tab]);

  const openPost = (id: string) => setDrawer(id);

  const sub: Record<string, string> = {
    overview: "What is ready to post, where new patients come from, and the draft paid campaign.",
    planner: "Weekly content calendar. Click a post to edit or approve it.",
    library: "Approval-ready posts. Edit, approve and schedule in demo.",
    local: "Target localities and the draft paid campaign settings, kept apart from organic planning.",
    performance: "New patients by source and locality. Attribution is fictional.",
  };

  return (
    <Page title="Marketing" sub={sub[tab] || sub.overview}>
      {tab === "planner" ? <Planner s={s} openPost={openPost} />
        : tab === "library" ? <Library s={s} selected={libSel} setSelected={setLibSel} />
        : tab === "local" ? <LocalGrowth s={s} />
        : tab === "performance" ? <Performance s={s} />
        : <Overview s={s} openPost={openPost} />}
      <PostDrawer postId={drawer} onClose={() => setDrawer(null)} />
    </Page>
  );
}
