/* Bridge between Pulse's existing logic (PulseLogic.js) and the clinic store.
   PulseLogic stays the owner of the shell, Home chat and Records ontology;
   this file feeds those surfaces from the live demo records and routes the
   clinic modules. */

import * as St from "./store";
import * as S from "./selectors";
import * as F from "./fixtures";
import { MODULE_TABS, CLINIC_PAGES, defaultTab } from "./modules";
import { HOME_PROMPTS } from "./answers";
import { SNAPSHOT, dayLabel, eur, relDay } from "./format";

type Logic = {
  state: Record<string, any>;
  props: Record<string, any>;
  setState: (u: any) => void;
  go: (page: string) => void;
  ask: (q: string) => void;
};

const GREEN = "var(--ok)", AMBER = "var(--warn)", RED = "var(--bad)", LIME = "var(--accent)", NEUTRAL = "var(--neutral)", DIM = "var(--dim)", FAINT = "var(--faint)", INK = "var(--ink)";

export function isLightTheme(themes: { id: string; group: string }[], id: string): boolean {
  return (themes.find((t) => t.id === id) || { group: "Dark" }).group === "Light";
}

export function tabOf(st: Record<string, any>, page: string): string {
  if (page === "Records") return st.recSection === "files" ? "documents" : st.recSection;
  return (st.ctab && st.ctab[page]) || defaultTab(page) || "";
}

/** Set a module's tab (and switch to the module). */
export function setTab(logic: Logic, page: string, tab: string) {
  if (page === "Records") {
    logic.setState({ recSection: tab === "documents" ? "files" : tab });
  } else if (tab) {
    logic.setState((p: any) => ({ ctab: { ...(p.ctab || {}), [page]: tab } }));
  }
  if (logic.state.page !== page) logic.go(page);
}

/** Wire store navigation to the shell. Call once on mount. */
export function connect(logic: Logic & { forceUpdate: () => void }): () => void {
  St.setNavigator((page, tab, id) => {
    if (id) St.setFocus(page, id);
    if (page === "Home") { logic.go("Home"); return; }
    setTab(logic, page, tab || tabOf(logic.state, page));
    const el = document.querySelector("[data-scroll-main]");
    if (el) el.scrollTop = 0;
  });
  return St.subscribe(() => logic.forceUpdate());
}

/* Top-bar tabs for clinic modules. Returns null for pages Pulse handles itself. */
export function clinicContextNav(logic: Logic, page: string) {
  if (!MODULE_TABS[page]) return null;
  const s = St.getState();
  const st = logic.state;
  const tab = tabOf(st, page);
  const counts: Record<string, Record<string, string>> = {
    Bookings: { waitlist: String(s.waitlist.filter((w) => w.status !== "Booked").length) },
    Patients: { preparation: String(S.prepOutstanding(s).length) },
    Inbox: { conversations: String(S.inboxCounts(s).open), drafts: String(S.inboxCounts(s).drafts) },
    Marketing: { library: String(S.postsAwaiting(s).length) },
    Finance: { transactions: String(S.receiptQueue(s).count) },
    Work: { tasks: String(S.openTasks(s).length), approvals: String(S.approvals(s).length) },
    Agents: { runs: String(F.AGENT_RUNS.filter((r) => S.runApproval(s, r) === "Awaiting approval").length) },
  };
  const tabs = MODULE_TABS[page].map((t) => ({
    label: t.label, active: tab === t.id, count: (counts[page] && counts[page][t.id] !== "0" && counts[page][t.id]) || "",
    go: () => setTab(logic, page, t.id),
  }));
  const w = S.week(s);
  const hints: Record<string, string> = {
    Bookings: "BOOKINGS · " + w.booked + " OF " + w.capacity + " BOOKED",
    Patients: "PATIENTS · " + s.patients.length + " RECORDS",
    Inbox: "INBOX · " + S.inboxCounts(s).open + " OPEN",
    Marketing: "MARKETING · " + S.postsAwaiting(s).length + " TO APPROVE",
    Finance: "FINANCE · " + eur(S.receiptQueue(s).total) + " TO MATCH",
    Dashboard: "DASHBOARD · WEEK OF 10 NOV",
    Agents: "AGENTS · DRAFT-FIRST",
    Work: "WORK · " + S.openTasks(s).length + " OPEN",
    Activity: "ACTIVITY · DEMO EVENTS",
    Settings: "SETTINGS · LOCAL ONLY",
  };
  return { tabs, hint: hints[page] || "", search: "Search patients, bookings and pages" };
}

/* KPI band values (Dashboard → Clinic), refreshed from the records. */
export function syncKpis(defs: Record<string, any>) {
  const s = St.getState();
  const w = S.week(s), t = S.today(s), q = S.receiptQueue(s), ib = S.inboxCounts(s), ls = S.localShare(s), oct = S.october(s);
  const set = (k: string, value: string, delta: string) => { if (defs[k]) { defs[k].value = value; defs[k].delta = delta; } };
  set("week", w.booked + " of " + w.capacity, w.utilisation + "%");
  set("today", String(t.booked), t.open + " open");
  set("receipts", eur(q.total), q.count + " receipt" + (q.count === 1 ? "" : "s"));
  set("drafts", String(ib.drafts), ib.personal + " personal");
  set("local", ls.pct + "%", ls.local + " of " + ls.newPatients);
  set("prep", String(S.prepOutstanding(s).length), "outstanding");
  set("posts", String(S.postsAwaiting(s).length), "in library");
  set("surplus", eur(oct.surplus), "before tax");
}

const GLYPH_ROW = "display:flex;align-items:center;gap:13px;width:100%;padding:10px 14px;background:none;border:0;color:var(--body);font-size:13.5px;text-align:left;cursor:pointer;transition:background .18s var(--ease),color .18s var(--ease)";

/* Command palette: clinic pages, patients, tasks and actions. */
export function paletteSearch(logic: Logic, ql: string, recents: string[], themeAction: string, toggleTheme: () => void) {
  const s = St.getState();
  const pages = Object.entries(MODULE_TABS).flatMap(([page, tabs]) => tabs.map((t) => ({
    title: page + " · " + t.label, meta: "Open page", hint: "PAGE", glyph: "page",
    go: () => { logic.setState({ paletteOpen: false }); setTab(logic, page, t.id); },
  })));
  const patients = s.patients
    .filter((p) => !ql || (p.name + " " + p.id + " " + p.locality).toLowerCase().includes(ql))
    .slice(0, ql ? 6 : 3)
    .map((p) => ({ title: p.name, meta: p.id + " · " + p.locality + " · fictional", hint: "PATIENT", glyph: "person",
      go: () => { logic.setState({ paletteOpen: false }); setTab(logic, "Patients", "directory"); St.openPatient(p.id); } }));
  const tasks = S.openTasks(s).slice(0, 5).map((t) => ({ title: t.title, meta: t.area + " · due " + dayLabel(t.due), hint: "TASK", glyph: "task",
    go: () => { logic.setState({ paletteOpen: false }); setTab(logic, "Work", "tasks"); } }));
  return [
    recents.length ? { group: "Recent", scope: "All", items: recents.slice(0, 3).map((r) => ({ title: r, meta: "Recent search", hint: "AGAIN", glyph: "recent", go: () => logic.setState({ query: r, palSel: 0 }) })) } : null,
    { group: "Actions", scope: "Actions", items: [
      { title: "Start a new Pulse conversation", meta: "Clears the current thread", hint: "ACTION", glyph: "action", go: () => logic.setState({ page: "Home", thread: [], typed: 0, draft: "", paletteOpen: false }) },
      { title: "Review approvals", meta: "Work · approvals", hint: "ACTION", glyph: "action", go: () => { logic.setState({ paletteOpen: false }); setTab(logic, "Work", "approvals"); } },
      { title: "Book an appointment", meta: "Bookings · online booking preview", hint: "ACTION", glyph: "action", go: () => { logic.setState({ paletteOpen: false }); setTab(logic, "Bookings", "online"); } },
      { title: themeAction, meta: "Appearance", hint: "ACTION", glyph: "action", go: toggleTheme },
      { title: "Reset the demo", meta: "Settings · experience", hint: "ACTION", glyph: "action", go: () => { logic.setState({ paletteOpen: false }); setTab(logic, "Settings", "experience"); } },
    ] },
    { group: "Agents", scope: "Agents", items: F.AGENTS.slice(0, 4).map((a) => ({ title: a.name, meta: a.responsibility, hint: "AGENT", glyph: "agent",
      go: () => logic.setState({ page: "Agents", agentId: a.id, paletteOpen: false, ctab: { ...(logic.state.ctab || {}), Agents: "overview" } }) })) },
    { group: "Work", scope: "Work", items: tasks },
    { group: "Records", scope: "Records", items: patients },
    { group: "Pages", scope: "Pages", items: pages },
  ].filter(Boolean) as { group: string; scope: string; items: any[] }[];
}

/* Overrides applied to Pulse's render object. */
export function applyClinic(logic: Logic, v: Record<string, any>, themes: { id: string; label: string; group: string }[]) {
  const s = St.getState();
  const st = logic.state, page = st.page as string;
  const tab = tabOf(st, page);
  const light = isLightTheme(themes, st.theme);

  /* routing */
  const clinicRoute = CLINIC_PAGES.includes(page) || (page === "Agents" && tab !== "overview") || (page === "Records" && tab === "registry");
  Object.assign(v, {
    clinic: { page, tab }, clinicRoute,
    isWork: false, isSettings: false, isActivity: false,
    showKpiBand: page === "Dashboard" && tab === "clinic",
    isAgents: page === "Agents" && tab === "overview",
    showPillNav: true,
    dashTitle: "This week · Tue 10 to Fri 13 Nov",
  });
  if (page === "Records" && tab === "registry" && v.rec) v.rec = { ...v.rec, hasHero: false };

  /* Ontology: legend and totals count the real demo records (the graph's dots are a visual sample). */
  if (v.graph && Array.isArray(v.graph.legend)) {
    const receipts = s.transactions.filter((x) => x.kind === "Receipt");
    const real: Record<string, number> = {
      Patients: s.patients.length, Appointments: s.appointments.length, Services: F.SERVICES.length,
      Conversations: s.conversations.length, Receipts: receipts.length, Tasks: S.taskRows(s).length,
      Content: s.posts.length, "Agent runs": F.AGENT_RUNS.length,
    };
    const rels = s.appointments.length * 3 + receipts.filter((x) => x.patientId).length * 2
      + s.conversations.filter((c) => c.patientId).length + S.taskRows(s).length
      + s.posts.filter((p) => p.campaignId).length + F.AGENT_RUNS.reduce((n, r) => n + r.links.length + 1, 0);
    v.graph = { ...v.graph,
      nodeCount: Object.values(real).reduce((a, b) => a + b, 0).toLocaleString("en-IE"),
      edgeCount: rels.toLocaleString("en-IE"),
      legend: v.graph.legend.map((l: any) => ({ ...l, count: real[l.label] !== undefined ? String(real[l.label]) : l.count })),
    };
  }

  /* rail: Inbox dot follows open drafts */
  const ib = S.inboxCounts(s);
  if (Array.isArray(v.nav)) for (const n of v.nav) if (n.isItem && n.label === "Inbox") n.dot = ib.drafts > 0;

  /* theme */
  const toggleTheme = () => logic.setState((p: any) => isLightTheme(themes, p.theme)
    ? { theme: p.darkTheme || "harbour", lightTheme: p.theme }
    : { theme: p.lightTheme || "milltown", darkTheme: p.theme });
  Object.assign(v, {
    toggleTheme,
    themeLabel: light ? "Switch to dark" : "Switch to light",
    sunStyle: "position:absolute;inset:0;transition:transform .42s cubic-bezier(.16,1,.3,1),opacity .26s var(--ease);" + (light ? "transform:none;opacity:1;color:var(--accent)" : "transform:rotate(-80deg) scale(.55);opacity:0"),
    moonStyle: "position:absolute;inset:0;transition:transform .42s cubic-bezier(.16,1,.3,1),opacity .26s var(--ease);" + (light ? "transform:rotate(80deg) scale(.55);opacity:0" : "transform:none;opacity:1"),
    kpiBackdropOn: !light && logic.props.kpiBackdropOn !== false,
    themeChoices: themes.map((t) => ({ id: t.id, label: t.label, group: t.group, active: st.theme === t.id, pick: () => logic.setState({ theme: t.id }) })),
  });

  /* Home: greeting agrees with the 08:30 demo clock */
  const t = S.today(s), q = S.receiptQueue(s), prep = S.prepOutstanding(s), posts = S.postsAwaiting(s), apps = S.approvals(s);
  const goTo = (p: string, tb?: string) => () => St.go(p, tb);
  Object.assign(v, {
    greetingPrefix: "Good morning",
    greetingName: "Deborah",
    homeSubline: dayLabel(SNAPSHOT.date) + ", " + SNAPSHOT.time + " · " + t.booked + " appointments today, " + t.open + " open",
    approvalsPill: apps.length + " APPROVALS WAITING · DEMO",
    goApprovals: goTo("Work", "approvals"),
    homeEyebrow: "7 AGENTS · DRAFT-FIRST · DEMO SNAPSHOT " + SNAPSHOT.time,
    contextHint: page === "Home" ? "PULSE · " + apps.length + " APPROVALS WAITING" : page === "Records" ? "RECORDS · " + (tab === "documents" ? "DOCUMENTS" : tab.toUpperCase()) : v.contextHint,
    searchHint: page === "Home" ? "Search patients, bookings and pages" : v.searchHint,
    suggestions: HOME_PROMPTS.slice(0, 3).map((p) => ({ label: p, run: () => logic.ask(p) })),
    composerTools: [
      { label: "Bookings", icon: v.composerTools?.[0]?.icon, go: goTo("Bookings", "overview") },
      { label: "Inbox", icon: v.composerTools?.[1]?.icon, go: goTo("Inbox", "drafts") },
      { label: "Records", icon: v.composerTools?.[2]?.icon, go: goTo("Records", "ontology") },
    ],
    composerPrompts: (v.composerPrompts || []).slice(0, 1).length ? HOME_PROMPTS.map((p, i) => ({
      label: p, tag: ["TODAY", "MONEY", "INBOX", "CAPACITY"][i], icon: v.composerPrompts[Math.min(i, v.composerPrompts.length - 1)].icon,
      run: () => logic.ask(p),
      rowStyle: GLYPH_ROW + (i ? ";border-top:1px solid var(--border)" : ""),
    })) : [],
  });

  /* Home widget rail */
  const inboxRows = [
    t.open ? { title: t.open + " open slot" + (t.open === 1 ? "" : "s") + " today", why: S.openSlots(s, [SNAPSHOT.date]).map((x) => x.start).join(", ") + " · " + s.waitlist.filter((w) => w.status !== "Booked").length + " on the waitlist", age: "Bookings", dot: AMBER, open: goTo("Bookings", "waitlist") } : null,
    q.count ? { title: q.count + " receipt" + (q.count === 1 ? "" : "s") + " to match · " + eur(q.total), why: "Received funds awaiting allocation", age: "Finance", dot: AMBER, open: goTo("Finance", "transactions") } : null,
    ib.drafts ? { title: ib.drafts + " message draft" + (ib.drafts === 1 ? "" : "s") + " ready", why: ib.personal + " other conversation" + (ib.personal === 1 ? "" : "s") + " need you personally", age: "Inbox", dot: LIME, open: goTo("Inbox", "drafts") } : null,
    prep.length ? { title: prep.length + " preparation check" + (prep.length === 1 ? "" : "s"), why: prep.map((p) => p.patient.name).slice(0, 2).join(", ") + (prep.length > 2 ? " and others" : ""), age: "Patients", dot: AMBER, open: goTo("Patients", "preparation") } : null,
    posts.length ? { title: posts.length + " post" + (posts.length === 1 ? "" : "s") + " to approve", why: "Nothing is published without your yes", age: "Marketing", dot: NEUTRAL, open: goTo("Marketing", "library") } : null,
  ].filter(Boolean);
  const open = S.openTasks(s);
  const done = S.taskRows(s).filter((x) => x.status === "Done");
  const taskItems = [...open.slice(0, 4), ...done.slice(0, 1)].map((x) => {
    const isDone = x.status === "Done";
    const late = !isDone && x.due < SNAPSHOT.date;
    return {
      id: x.id, title: x.title, due: isDone ? "Done" : relDay(x.due), late,
      checkOpacity: isDone ? "1" : "0", fill: isDone ? LIME : "transparent", ring: isDone ? LIME : "var(--track)",
      color: isDone ? FAINT : INK, strike: isDone ? "line-through" : "none",
      dueColor: isDone ? FAINT : (x.due === SNAPSHOT.date ? AMBER : "var(--mid)"),
      toggle: () => St.setTaskStatus(x.id, isDone ? "To do" : "Done"),
    };
  });
  const acts = S.activity(s).slice(0, 5).map((e) => ({
    who: e.actor, what: e.text.replace(/\.$/, ""), event: e.kind, when: e.at.slice(0, 10) === SNAPSHOT.date ? e.at.slice(11) : dayLabel(e.at.slice(0, 10)),
    dot: e.kind === "Your action" ? GREEN : e.kind === "Agent proposal" ? LIME : e.kind === "Imported" ? NEUTRAL : DIM,
  }));
  const todayAppts = S.apptsOn(s, [SNAPSHOT.date]).filter((a) => a.slotId).slice(0, 6);
  Object.assign(v, {
    inboxTop: inboxRows.slice(0, 4),
    inboxCount: String(inboxRows.length),
    inboxEmpty: inboxRows.length === 0,
    tasks: taskItems,
    taskSummary: done.length + " of " + (open.length + done.length) + " done",
    activity: acts,
    visitWidget: todayAppts.map((a) => ({ title: S.slotOf(a).start + " · " + S.patientOf(s, a.patientId).name, when: S.serviceOf(a).name, dot: a.isNew ? LIME : NEUTRAL })),
    miniKpis: [
      { label: "Today", value: String(t.booked), delta: t.open + " open", deltaColor: AMBER },
      { label: "This week", value: S.week(s).utilisation + "%", delta: "slot utilisation", deltaColor: GREEN },
      { label: "To match", value: eur(q.total), delta: q.count + " receipts", deltaColor: AMBER },
      { label: "Drafts", value: String(ib.drafts), delta: ib.personal + " personal", deltaColor: GREEN },
    ],
    widgetHint: v.widgetEdit ? "EDITING BOARD" : "DEMO DATA",
    // Phones: the widget rail would cover the chat; Home keeps the chat, the same items live in their modules.
    showRail: v.showRail && (st.w || 1440) >= 900,
  });

  /* notifications */
  const feed = S.activity(s).slice(0, 5);
  Object.assign(v, {
    notifications: feed.map((e, i) => {
      const dot = e.kind === "Your action" ? GREEN : e.kind === "Agent proposal" ? LIME : e.kind === "Imported" ? NEUTRAL : DIM;
      return {
        ...(v.notifications && v.notifications[0] ? {} : {}),
        dot, text: e.text, when: e.at.slice(0, 10) === SNAPSHOT.date ? "Today " + e.at.slice(11) : dayLabel(e.at.slice(0, 10)), event: e.kind,
        cardStyle: "position:relative;flex:none;display:flex;align-items:flex-start;gap:11px;padding:13px 15px;border-radius:var(--r-md,16px);cursor:pointer;background:var(--surface);border:1px solid var(--border);animation:notifCard .62s cubic-bezier(.16,1,.28,1) " + (110 + i * 62) + "ms both",
        washStyle: "position:absolute;left:0;top:0;bottom:0;width:58%;pointer-events:none;border-radius:var(--r-md,16px) 0 0 16px;background:linear-gradient(90deg,var(--accent-faint), transparent 78%)",
        dotStyle: "position:relative;width:7px;height:7px;border-radius:50%;flex:none;margin-top:5px;background:" + dot,
      };
    }),
    team: [{ i: "DG", bg: "var(--accent-soft)" }],
  });
  void RED;
  return v;
}
