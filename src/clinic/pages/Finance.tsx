/* Finance: recorded revenue and costs from the demo Revolut import, the
   reconciliation queue, and an accountant pack export. Matching a receipt
   records an allocation only; it never adds revenue or cash a second time.
   Not a tax filing system. */

import { useEffect, useMemo, useState } from "react";
import * as F from "../fixtures";
import { useClinic, useUi, go, takeFocus, toast, matchReceipt, rejectProposal, setFocus, openPatient } from "../store";
import type { ClinicState } from "../store";
import { october, monthOf, receiptQueue, patientAppts, patientOf, slotOf, serviceOf } from "../selectors";
import { dateShort, dayLabel, eur, eur2, plural } from "../format";
import { Page, Grid, Panel, Badge, Btn, Table, Drawer, Tabs, Field, Search, Note, Kv, BarList, Columns, Stats, Stat, Progress, DemoTag, Empty } from "../ui";
import type { Column, Tone } from "../ui";

type Tx = F.Transaction;

/* ── helpers ───────────────────────────────────────────────────────────── */
const CAT_SHORT: Record<F.CostCategory, string> = {
  "Room rental": "Room rental",
  Consumables: "Consumables",
  Insurance: "Insurance",
  "Software and communications": "Software and communications",
  "Other business expenses": "Other",
};
/** Area for a receipt: its own, or the service area of the allocated appointment. */
function areaOf(s: ClinicState, t: Tx): string {
  if (t.kind === "Expense") return t.category ? CAT_SHORT[t.category] : "";
  if (t.area) return t.area;
  if (t.appointmentId) {
    const a = s.appointments.find((x) => x.id === t.appointmentId);
    if (a) return serviceOf(a).area;
  }
  return "";
}
function statusOf(t: Tx): { label: string; tone: Tone } {
  if (t.kind === "Expense") return t.docOnFile ? { label: "Document on file", tone: "ok" } : { label: "Document missing", tone: "warn" };
  if (t.matched) return { label: "Matched", tone: "ok" };
  if (t.proposedPatientId) return { label: "Proposal ready", tone: "accent" };
  return { label: "Awaiting allocation", tone: "warn" };
}
function apptLine(a: F.Appointment): string {
  const sl = slotOf(a);
  return serviceOf(a).name + ", " + dayLabel(sl.date) + " " + sl.start;
}

/* ── overview ──────────────────────────────────────────────────────────── */
function Overview({ s, openTx }: { s: ClinicState; openTx: (id: string) => void }) {
  const oct = october(s);
  const nov = monthOf(s, "2026-11");
  const q = receiptQueue(s);
  const novMatched = nov.rows.filter((t) => t.kind === "Receipt" && t.matched);

  return (
    <>
      <Grid cols="1fr 1fr">
        <Panel title="October 2026" meta="1 to 31 Oct, recorded">
          <Stats min={130}>
            <Stat label="Recorded revenue" value={eur(oct.revenue)} />
            <Stat label="Recorded costs" value={eur(oct.costs)} />
            <Stat label="Operating surplus" value={eur(oct.surplus)} tone="ok" note="Before tax and owner drawings" />
          </Stats>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn size="sm" onClick={() => go("Finance", "revenue")}>Revenue and costs</Btn>
            <Btn size="sm" variant="ghost" onClick={() => go("Finance", "accountant")}>Accountant pack</Btn>
          </div>
        </Panel>

        <Panel title="November to date" meta="1 to 9 Nov, demo import">
          <Stats min={130}>
            <Stat label="Received funds" value={eur(nov.received)} note={plural(novMatched.length, "receipt") + " already matched"} />
            <Stat label="Awaiting allocation" value={eur(q.total)} tone={q.count ? "warn" : "ok"} note={plural(q.count, "receipt")} onClick={() => go("Finance", "transactions")} />
          </Stats>
          <div style={{ marginTop: 12 }}>
            <Note>The queue is received funds awaiting allocation to a patient. These are not unpaid invoices or lost revenue: the money is already in the account.</Note>
          </div>
        </Panel>
      </Grid>

      <Panel title="Reconciliation queue" meta={plural(q.count, "receipt") + " · " + eur(q.total)}
        actions={<Btn size="sm" variant="primary" onClick={() => go("Finance", "transactions")}>Open transactions</Btn>} flush>
        {q.count ? (
          <div className="c-list">
            {q.list.map((t) => (
              <button key={t.id} type="button" className="c-li" onClick={() => openTx(t.id)}>
                <div className="grow">
                  <div className="t c-ellipsis">{t.description}</div>
                  <div className="s">{dateShort(t.date)} · {t.counterparty}</div>
                </div>
                {t.proposedPatientId && <Badge tone="accent">Proposal: {patientOf(s, t.proposedPatientId).name}</Badge>}
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)", fontWeight: 500 }}>{eur(t.amount)}</span>
              </button>
            ))}
          </div>
        ) : <Empty title="Every received payment is matched" />}
      </Panel>
    </>
  );
}

/* ── transactions ──────────────────────────────────────────────────────── */
type Kind = "all" | "receipts" | "expenses" | "unmatched";
type Month = "all" | "2026-10" | "2026-11";

function Transactions({ s, openTx, selected }: { s: ClinicState; openTx: (id: string) => void; selected: string | null }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [month, setMonth] = useState<Month>("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.transactions
      .filter((t) => (month === "all" ? true : t.date.startsWith(month)))
      .filter((t) => kind === "all" ? true : kind === "receipts" ? t.kind === "Receipt" : kind === "expenses" ? t.kind === "Expense" : t.kind === "Receipt" && !t.matched)
      .filter((t) => !needle || [t.description, t.counterparty, t.id, areaOf(s, t), String(t.amount)].some((x) => x.toLowerCase().includes(needle)))
      .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  }, [s, q, kind, month]);

  const unmatched = s.transactions.filter((t) => t.kind === "Receipt" && !t.matched).length;
  const cols: Column<Tx>[] = [
    { key: "date", label: "Date", render: (t) => dateShort(t.date), width: "96px" },
    { key: "desc", label: "Description", strong: true, render: (t) => <span>{t.description}<span className="c-hide-sm" style={{ display: "block", fontSize: 11, color: "var(--faint)", fontWeight: 400 }}>{t.kind}</span></span> },
    { key: "cp", label: "Counterparty", render: (t) => t.counterparty, hideSm: true },
    { key: "area", label: "Area or category", render: (t) => areaOf(s, t) || <span style={{ color: "var(--faint)" }}>Not yet allocated</span>, hideSm: true },
    { key: "src", label: "Source", render: (t) => <span style={{ color: "var(--dim)" }}>{t.source}</span>, hideSm: true },
    { key: "amt", label: "Amount", num: true, render: (t) => <span style={{ color: t.kind === "Expense" ? "var(--body)" : "var(--ink)" }}>{t.kind === "Expense" ? "-" : ""}{eur2(t.amount)}</span> },
    { key: "st", label: "Status", render: (t) => { const st = statusOf(t); return <Badge tone={st.tone}>{st.label}</Badge>; } },
  ];

  return (
    <Panel title="Transactions" meta={plural(rows.length, "row") + " shown"} flush>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "0 18px 12px" }}>
        <Search value={q} onChange={setQ} placeholder="Search description, payer or amount" label="Search transactions" />
        <Tabs items={[
          { id: "all" as Kind, label: "All" }, { id: "receipts" as Kind, label: "Receipts" },
          { id: "expenses" as Kind, label: "Expenses" }, { id: "unmatched" as Kind, label: "Unmatched", count: unmatched },
        ]} value={kind} onChange={setKind} />
        <select className="c-select" aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value as Month)} style={{ width: "auto", minWidth: 150 }}>
          <option value="all">October and November</option>
          <option value="2026-10">October 2026</option>
          <option value="2026-11">November to date</option>
        </select>
      </div>
      <Table columns={cols} rows={rows} rowKey={(t) => t.id} onRow={(t) => openTx(t.id)} selected={selected} pageSize={12}
        empty={<Empty title="No transactions match">Try a different search or filter.</Empty>} />
      <div style={{ padding: "10px 18px 14px" }}>
        <Note>Rows come from a Revolut CSV (demo import) of fictional transactions. Open an unmatched receipt to allocate it to a patient.</Note>
      </div>
    </Panel>
  );
}

/* ── matching drawer ───────────────────────────────────────────────────── */
function ManualMatch({ s, tx, onDone }: { s: ClinicState; tx: Tx; onDone: () => void }) {
  const [q, setQ] = useState("");
  const [pid, setPid] = useState<string | null>(null);
  const [apptId, setApptId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const needle = q.trim().toLowerCase();
  const results = needle.length < 2 ? [] : s.patients.filter((p) => p.name.toLowerCase().includes(needle) || p.id.toLowerCase().includes(needle)).slice(0, 6);
  const picked = pid ? patientOf(s, pid) : undefined;
  const appts = pid ? patientAppts(s, pid).filter((a) => a.status !== "Cancelled") : [];

  const submit = () => {
    if (!pid) { setError("Choose a patient first."); return; }
    const r = matchReceipt(tx.id, pid, apptId || undefined);
    if (!r.ok) { setError(r.error); return; }
    toast("Allocation recorded for " + patientOf(s, pid).name + ". Cash and revenue are unchanged.");
    onDone();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Find a patient" htmlFor="match-search" hint="Type at least two letters of a name or a patient ID.">
        <input id="match-search" className="c-input" value={q} onChange={(e) => { setQ(e.target.value); setError(null); }} placeholder="For example Kelly or PAT-072" />
      </Field>
      {results.length > 0 && (
        <div className="c-list" style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {results.map((p) => (
            <button key={p.id} type="button" className="c-li" aria-pressed={pid === p.id}
              style={pid === p.id ? { background: "var(--accent-faint)" } : undefined}
              onClick={() => { setPid(p.id); setApptId(""); setError(null); }}>
              <div className="grow">
                <div className="t">{p.name}</div>
                <div className="s">{p.id} · {p.locality}</div>
              </div>
              {pid === p.id && <Badge tone="accent">Selected</Badge>}
            </button>
          ))}
        </div>
      )}
      {needle.length >= 2 && !results.length && <div style={{ fontSize: 12, color: "var(--dim)" }}>No patient matches “{q}”.</div>}
      {picked && (
        <Field label={"Appointment for " + picked.name + " (optional)"} htmlFor="match-appt">
          <select id="match-appt" className="c-select" value={apptId} onChange={(e) => setApptId(e.target.value)}>
            <option value="">No specific appointment</option>
            {appts.map((a) => <option key={a.id} value={a.id}>{apptLine(a)} ({eur(serviceOf(a).price)}, illustrative)</option>)}
          </select>
        </Field>
      )}
      {error && <div className="c-field"><span className="err" role="alert">{error}</span></div>}
      <div><Btn variant="primary" disabled={!pid} onClick={submit}>Record allocation</Btn></div>
    </div>
  );
}

function TxDrawer({ s, txId, onClose }: { s: ClinicState; txId: string | null; onClose: () => void }) {
  const tx = txId ? s.transactions.find((t) => t.id === txId) : undefined;
  const open = !!tx;
  const needsMatch = !!tx && tx.kind === "Receipt" && !tx.matched;
  const prop = tx?.proposedPatientId ? patientOf(s, tx.proposedPatientId) : undefined;
  const propAppt = tx?.proposedAppointmentId ? s.appointments.find((a) => a.id === tx.proposedAppointmentId) : undefined;
  const allocated = tx?.patientId ? patientOf(s, tx.patientId) : undefined;
  const allocAppt = tx?.appointmentId ? s.appointments.find((a) => a.id === tx.appointmentId) : undefined;
  const st = tx ? statusOf(tx) : undefined;

  return (
    <Drawer open={open} onClose={onClose} title={needsMatch ? "Match received payment" : tx?.description || "Transaction"}
      sub={tx ? dateShort(tx.date) + " · " + eur2(tx.amount) + " · " + tx.id : undefined}>
      {tx && (
        <>
          <Kv items={[
            ["Date", dateShort(tx.date)],
            ["Type", tx.kind],
            ["Description", tx.description],
            ["Counterparty", tx.counterparty],
            ["Amount", eur2(tx.amount)],
            [tx.kind === "Expense" ? "Category" : "Area", areaOf(s, tx) || "Not yet allocated"],
            ["Source", tx.source],
            ["Status", st ? <Badge tone={st.tone}>{st.label}</Badge> : null],
          ]} />

          {needsMatch && (
            <>
              <Note>Matching records an allocation only. The payment is already counted in received funds; matching never adds revenue or cash a second time.</Note>
              {prop ? (
                <Panel tint title="Finance Agent proposal" meta={<DemoTag>Simulated agent</DemoTag>}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Kv items={[
                      ["Patient", <button key="p" type="button" className="c-btn ghost sm" style={{ padding: 0, height: "auto" }} onClick={() => openPatient(prop.id)}>{prop.name} ({prop.id})</button>],
                      ["Appointment", propAppt ? apptLine(propAppt) : "None proposed"],
                      ["Why", tx.proposedConfidence || "No reason given"],
                    ]} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn variant="primary" onClick={() => {
                        const r = matchReceipt(tx.id, prop.id, tx.proposedAppointmentId);
                        if (r.ok) { toast("Approved. " + eur(tx.amount) + " allocated to " + prop.name + ". Cash and revenue are unchanged."); onClose(); }
                        else toast(r.error);
                      }}>Approve match</Btn>
                      <Btn variant="danger" onClick={() => { rejectProposal(tx.id); toast("Proposal rejected. Allocate it manually below."); }}>Reject</Btn>
                    </div>
                  </div>
                </Panel>
              ) : (
                <Panel title="Manual allocation">
                  <ManualMatch s={s} tx={tx} onDone={onClose} />
                </Panel>
              )}
            </>
          )}

          {tx.kind === "Receipt" && tx.matched && (
            <Kv items={[
              ["Allocated to", allocated ? allocated.name + " (" + allocated.id + ")" : "Card settlement batch"],
              ["Appointment", allocAppt ? apptLine(allocAppt) : "Not linked"],
            ]} />
          )}
          {tx.kind === "Expense" && !tx.docOnFile && (
            <Note tone="warn">No receipt document on file for this expense. It is listed in the accountant pack.</Note>
          )}
        </>
      )}
    </Drawer>
  );
}

/* ── revenue and costs ─────────────────────────────────────────────────── */
function Revenue({ s }: { s: ClinicState }) {
  const oct = october(s);
  const areas = Object.entries(oct.revenueByArea) as [F.RevenueArea, number][];
  const cats = Object.entries(oct.costByCat) as [F.CostCategory, number][];
  const consumables = oct.costByCat.Consumables;
  const treatmentRev = oct.revenueByArea.Skin + oct.revenueByArea["Hair & scalp"];
  const contrib = areas.map(([area, rev]) => {
    const alloc = area === "Consultations" || !treatmentRev ? 0 : Math.round((consumables * rev) / treatmentRev);
    return { area, rev, alloc, contribution: rev - alloc };
  });

  return (
    <>
      <Grid cols="1fr 1fr">
        <Panel title="October service revenue by area" meta={"Recorded " + eur(oct.revenue)}>
          <Columns items={areas.map(([a, v]) => ({ label: a, value: v }))} format={eur} height={150} />
        </Panel>
        <Panel title="October costs by category" meta={"Recorded " + eur(oct.costs)}>
          <BarList items={[...cats].sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ label: CAT_SHORT[c], value: v }))} format={eur} />
        </Panel>
      </Grid>

      <Panel title="Contribution by service area" meta={<DemoTag>Illustrative</DemoTag>} flush>
        <Table<(typeof contrib)[number]>
          columns={[
            { key: "a", label: "Service area", strong: true, render: (r) => r.area },
            { key: "r", label: "Revenue", num: true, render: (r) => eur(r.rev) },
            { key: "c", label: "Allocated consumables", num: true, render: (r) => (r.alloc ? "-" + eur(r.alloc) : eur(0)) },
            { key: "x", label: "Contribution", num: true, render: (r) => <strong style={{ color: "var(--ink)" }}>{eur(r.contribution)}</strong> },
            { key: "p", label: "Share of revenue", num: true, hideSm: true, render: (r) => (oct.revenue ? Math.round((r.rev / oct.revenue) * 100) : 0) + "%" },
          ]}
          rows={contrib} rowKey={(r) => r.area} />
        <div style={{ padding: "10px 18px 14px" }}>
          <Note>
            Illustrative only. Assumption: consultations use no consumables, and October consumables ({eur(consumables)}) are split between Skin and Hair & scalp in proportion to their revenue.
            Room rental, insurance, software and other costs are shared and not allocated, so contribution is not the operating surplus.
          </Note>
        </div>
      </Panel>

      <Note>Operating surplus for October is {eur(oct.surplus)}, before tax and owner drawings. Figures are fictional and recorded from the demo import; they are not a tax calculation.</Note>
    </>
  );
}

/* ── accountant pack ───────────────────────────────────────────────────── */
type PackPeriod = "2026-10" | "2026-11";
const csvCell = (v: string | number) => {
  const x = String(v);
  return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x;
};

function Line({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", fontSize: 12.5 }}><span style={{ flex: 1, color: "var(--body)" }}>{label}</span><strong style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value} of {max}</strong></div>
      <Progress value={value} max={max} label={label} />
    </div>
  );
}

function Accountant({ s }: { s: ClinicState }) {
  const [period, setPeriod] = useState<PackPeriod>("2026-10");
  const m = monthOf(s, period);
  const label = period === "2026-10" ? "October 2026" : "November 2026 to date";
  const rows = [...m.rows].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const categorised = rows.filter((t) => !!areaOf(s, t)).length;
  const receipts = rows.filter((t) => t.kind === "Receipt");
  const receiptsMatched = receipts.filter((t) => t.matched).length;
  const expenses = rows.filter((t) => t.kind === "Expense");
  const withDocs = expenses.filter((t) => t.docOnFile).length;

  const exportCsv = () => {
    const head = ["date", "type", "description", "counterparty", "amount", "area_or_category", "matched", "document_on_file"];
    const lines = rows.map((t) => [
      dateShort(t.date), t.kind, t.description, t.counterparty, t.amount.toFixed(2), areaOf(s, t),
      t.kind === "Receipt" ? (t.matched ? "Yes" : "No") : "Not applicable",
      t.kind === "Expense" ? (t.docOnFile ? "Yes" : "No") : "Not applicable",
    ].map(csvCell).join(","));
    const csv = "﻿" + ["# Demo export: fictional data", head.join(","), ...lines].join("\r\n") + "\r\n";
    const name = "deborah-gough-accountant-pack-" + period + (period === "2026-11" ? "-to-date" : "") + "-demo.csv";
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = name; a.style.display = "none";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Downloaded " + name + " (" + plural(rows.length, "row") + "). Fictional data; nothing was sent to anyone.");
    } catch {
      toast("The download could not start in this browser.");
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Tabs items={[{ id: "2026-10" as PackPeriod, label: "October 2026" }, { id: "2026-11" as PackPeriod, label: "November to date" }]} value={period} onChange={setPeriod} />
        <span style={{ marginLeft: "auto" }}><Btn variant="primary" onClick={exportCsv} disabled={!rows.length}>Export CSV</Btn></span>
      </div>

      <Grid cols="1fr 1.2fr">
        <Panel title="Transaction completeness" meta={label}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Line label="Rows categorised" value={categorised} max={rows.length} />
            <Line label="Receipts matched" value={receiptsMatched} max={receipts.length} />
            {expenses.length
              ? <Line label="Expenses with documents on file" value={withDocs} max={expenses.length} />
              : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No expenses recorded for this period.</div>}
            {receipts.length > receiptsMatched && (
              <Btn size="sm" onClick={() => go("Finance", "transactions")}>Match {plural(receipts.length - receiptsMatched, "receipt")}</Btn>
            )}
          </div>
        </Panel>

        <Panel title="Missing documents" meta={plural(m.missingDocs.length, "expense") + (m.missingDocs.length ? " · " + eur(m.missingDocs.reduce((n, t) => n + t.amount, 0)) : "")} flush>
          <Table columns={[
            { key: "d", label: "Date", render: (t: Tx) => dateShort(t.date) },
            { key: "x", label: "Description", strong: true, render: (t: Tx) => t.description },
            { key: "c", label: "Supplier", hideSm: true, render: (t: Tx) => t.counterparty },
            { key: "a", label: "Amount", num: true, render: (t: Tx) => eur2(t.amount) },
          ]} rows={[...m.missingDocs].sort((a, b) => a.date.localeCompare(b.date))} rowKey={(t) => t.id}
            empty={<Empty title="Nothing missing">Every expense in this period has a document on file.</Empty>} />
        </Panel>
      </Grid>

      <Panel title="What the export contains" meta={<DemoTag>Demo export</DemoTag>}>
        <Kv items={[
          ["Period", label],
          ["Rows", plural(rows.length, "transaction")],
          ["Columns", "Date, type, description, counterparty, amount, area or category, matched, document on file"],
          ["File", "deborah-gough-accountant-pack-" + period + (period === "2026-11" ? "-to-date" : "") + "-demo.csv"],
        ]} />
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <Note>This is a bookkeeping pack for review, not a tax filing system. Pulse does not calculate or submit tax.</Note>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, color: "var(--dim)" }}>
            <span>The accountant has not been invited yet.</span>
            <Btn size="sm" variant="ghost" onClick={() => go("Settings", "people")}>See People & permissions</Btn>
          </div>
        </div>
      </Panel>
    </>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */
export default function Finance({ tab }: { tab: string; v: any }) {
  const s = useClinic();
  const ui = useUi();
  const [txId, setTxId] = useState<string | null>(null);

  const pendingFocus = ui.focus.Finance;
  useEffect(() => {
    const id = takeFocus("Finance");
    if (id && s.transactions.some((t) => t.id === id)) setTxId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFocus, tab]);

  // From the overview queue: open the record in place and move to Transactions.
  const openFromOverview = (id: string) => { setFocus("Finance", id); setTxId(id); go("Finance", "transactions", id); };

  const sub: Record<string, string> = {
    overview: "Recorded figures for October and received funds for November, from the demo Revolut import.",
    transactions: "Every imported row. Open an unmatched receipt to allocate it.",
    revenue: "October revenue by service area and costs by category.",
    accountant: "Completeness check and CSV export for the accountant.",
  };

  return (
    <Page title="Finance" sub={sub[tab] || sub.overview}>
      {tab === "transactions" ? <Transactions s={s} openTx={setTxId} selected={txId} />
        : tab === "revenue" ? <Revenue s={s} />
        : tab === "accountant" ? <Accountant s={s} />
        : <Overview s={s} openTx={openFromOverview} />}
      <TxDrawer s={s} txId={txId} onClose={() => setTxId(null)} />
    </Page>
  );
}
