/* Inbox module: conversations, the draft approval queue and the response
   library. Channels are simulated: nothing is received from or sent to a
   real Instagram, WhatsApp or email account. Approving a draft marks it
   "Sent in demo" and nothing leaves Pulse. */

import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import * as F from "../fixtures";
import { dayLabel, relDay } from "../format";
import {
  approveDraft, closeConversation, editDraft, go, openPatient, regenerateDraft, rejectDraft, takeFocus, toast, useClinic, useUi,
  type ConvRow, type ConvState,
} from "../store";
import { inboxCounts, openDrafts } from "../selectors";
import { Badge, Btn, DemoTag, Drawer, Empty, Field, Grid, Kv, Note, Page, Panel, Table, Tabs, type Column, type Tone } from "../ui";

type Focus = { id: string; n: number } | null;

const linkBtn: CSSProperties = { background: "none", border: 0, padding: 0, font: "inherit", fontSize: 11.5, color: "var(--accent)", cursor: "pointer" };
const quote: CSSProperties = { margin: 0, padding: "10px 12px", borderRadius: 10, background: "var(--surface-faint)", border: "1px solid var(--border)", fontSize: 13, color: "var(--ink)", lineHeight: 1.55 };
const CAT_TONE: Record<F.ConvCategory, Tone> = { "Draft ready": "accent", "Personal review": "warn", "Awaiting information": "neutral" };
const STATE_TONE: Record<ConvState, Tone> = { Open: "accent", "Sent in demo": "ok", Closed: "neutral" };
const CATS: F.ConvCategory[] = ["Draft ready", "Personal review", "Awaiting information"];

function received(at: string): string {
  const [d, t] = at.split(" ");
  return relDay(d) + ", " + t;
}

export default function Inbox({ tab }: { tab: string; v: unknown }) {
  const ui = useUi();
  const [focus, setFocus] = useState<Focus>(() => {
    const id = takeFocus("Inbox");
    return id ? { id, n: 1 } : null;
  });
  // Focus can also arrive while the page is already mounted (e.g. from the patient drawer).
  useEffect(() => {
    if (!ui.focus.Inbox) return;
    const id = takeFocus("Inbox");
    if (id) setFocus((f) => ({ id, n: (f?.n || 0) + 1 }));
  }, [ui.focus.Inbox]);

  if (tab === "drafts") return <Drafts focus={focus} />;
  if (tab === "library") return <Library />;
  return <Conversations focus={focus} />;
}

/* ── Conversations ──────────────────────────────────────────────────────── */

type StateFilter = "Open" | "Sent in demo" | "Closed" | "All";

function Conversations({ focus }: { focus: Focus }) {
  const s = useClinic();
  const ib = inboxCounts(s);
  const [stateF, setStateF] = useState<StateFilter>("Open");
  const [cat, setCat] = useState<"all" | F.ConvCategory>("all");
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!focus) return;
    const c = s.conversations.find((x) => x.id === focus.id);
    if (!c) return;
    if (c.state !== "Open") { setStateF("All"); setCat("all"); }
    setSel(c.id);
    // Only react to a new focus request, not to every store change.
  }, [focus?.n]);

  const inState = useMemo(() => s.conversations.filter((c) => stateF === "All" || c.state === stateF), [s.conversations, stateF]);
  const rows = useMemo(() => inState.filter((c) => cat === "all" || c.category === cat).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)), [inState, cat]);
  const stateCount = (st: StateFilter) => (st === "All" ? s.conversations.length : s.conversations.filter((c) => c.state === st).length);
  const catCount = (c: F.ConvCategory) => inState.filter((x) => x.category === c).length;
  const selected = sel ? s.conversations.find((c) => c.id === sel) : undefined;

  const stopRow = (e: MouseEvent | KeyboardEvent) => e.stopPropagation();
  const columns: Column<ConvRow>[] = [
    { key: "contact", label: "Contact", render: (c) => (
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "var(--ink)", fontWeight: 500 }}>{c.contactName}</div>
        {c.patientId
          ? <button type="button" className="c-focus" style={linkBtn} onClick={(e) => { stopRow(e); openPatient(c.patientId!); }} onKeyDown={stopRow}>Patient {c.patientId}</button>
          : <div style={{ fontSize: 11.5, color: "var(--faint)" }}>Not yet a patient</div>}
      </div>
    ) },
    { key: "channel", label: "Channel", hideSm: true, render: (c) => c.channel },
    { key: "age", label: "Age", hideSm: true, render: (c) => c.age },
    { key: "purpose", label: "Purpose", render: (c) => (
      <div style={{ minWidth: 0, maxWidth: 300 }}>
        <div style={{ color: "var(--ink)" }}>{c.purpose}</div>
        <div className="c-ellipsis" style={{ fontSize: 11.5, color: "var(--dim)" }}>{c.lastMessage}</div>
      </div>
    ) },
    { key: "category", label: "Category", render: (c) => <Badge tone={CAT_TONE[c.category]}>{c.category}</Badge> },
    { key: "owner", label: "Owner", hideSm: true, render: (c) => c.owner },
    { key: "state", label: "State", render: (c) => <Badge tone={STATE_TONE[c.state]}>{c.state}</Badge> },
  ];

  return (
    <Page title="Conversations"
      sub={ib.open + " open: " + ib.drafts + " drafts ready, " + ib.personal + " for personal review and " + ib.awaiting + " awaiting information. " + ib.sent + " sent in demo so far."}
      actions={ib.drafts > 0 ? <Btn variant="primary" onClick={() => go("Inbox", "drafts")}>Review {ib.drafts} drafts</Btn> : undefined}>
      <Note>Channels are simulated in this demo. Instagram, WhatsApp and email are not technically connected, and every message here is fictional.</Note>
      <Panel flush>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "14px 18px 12px" }}>
          <Tabs<StateFilter> value={stateF} onChange={(v) => { setStateF(v); setCat("all"); }} items={(["Open", "Sent in demo", "Closed", "All"] as StateFilter[]).map((x) => ({ id: x, label: x, count: stateCount(x) }))} />
          <Tabs<"all" | F.ConvCategory> value={cat} onChange={setCat}
            items={[{ id: "all", label: "Any category", count: inState.length }, ...CATS.map((c) => ({ id: c, label: c, count: catCount(c) }))]} />
        </div>
        <Table key={stateF + "|" + cat} columns={columns} rows={rows} rowKey={(c) => c.id} onRow={(c) => setSel(c.id)} selected={sel}
          empty={<Empty title={stateF === "Open" ? "Inbox clear" : "Nothing here"}>No conversations match this filter.</Empty>} />
      </Panel>
      {selected && <ConversationDrawer c={selected} onClose={() => setSel(null)} />}
    </Page>
  );
}

function ConversationDrawer({ c, onClose }: { c: ConvRow; onClose: () => void }) {
  const clinical = c.purpose === "Clinical question";
  const hasReadyDraft = c.state === "Open" && c.category === "Draft ready" && c.draftState === "Ready";
  const canClose = c.state === "Open" && (c.category === "Personal review" || c.category === "Awaiting information");
  return (
    <Drawer open onClose={onClose} width={540} title={c.contactName}
      sub={<span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{c.channel} · {c.purpose}<DemoTag>Simulated channel</DemoTag></span>}
      footer={<>
        {canClose && <Btn variant="primary" onClick={() => { closeConversation(c.id); toast("Marked handled personally. Nothing was sent from Pulse."); }}>Mark handled personally</Btn>}
        <Btn onClick={onClose}>Close</Btn>
      </>}>
      <Kv items={[
        ["Received", received(c.receivedAt) + " (" + c.age + " ago)"],
        ["Category", <Badge key="c" tone={CAT_TONE[c.category]}>{c.category}</Badge>],
        ["Owner", c.owner],
        ["State", <Badge key="s" tone={STATE_TONE[c.state]}>{c.state}</Badge>],
        ["Related patient", c.patientId
          ? <button key="p" type="button" className="c-focus" style={{ ...linkBtn, fontSize: 12.5 }} onClick={() => { onClose(); openPatient(c.patientId!); }}>{c.contactName} ({c.patientId})</button>
          : "Not linked to a patient record"],
      ]} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Last message</div>
        <p style={quote}>{c.lastMessage}</p>
      </div>
      {c.routingNote && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Routing note</div>
          <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{c.routingNote}</div>
        </div>
      )}
      {clinical && (
        <Note tone="warn">Clinical question, routed to Deborah to answer personally. The Inbox Assistant did not write a draft and made no treatment recommendation.</Note>
      )}
      {hasReadyDraft && <DraftEditor c={c} />}
      {c.state === "Open" && c.draftState === "Rejected" && (
        <Note>Draft rejected. Deborah will reply herself, so this conversation now sits under personal review.</Note>
      )}
      {c.state === "Open" && c.category === "Personal review" && !c.draft && !clinical && (
        <Note>No AI draft for this one. It was left for Deborah to answer herself.</Note>
      )}
      {c.state === "Open" && c.category === "Awaiting information" && (
        <Note>Waiting for the patient to come back with details. No reply is needed yet.</Note>
      )}
      {c.state === "Sent in demo" && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Approved reply</div>
          <p style={quote}>{c.sentText || c.draft}</p>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--dim)" }}>Sent in demo, nothing left Pulse.</div>
        </div>
      )}
      {c.state === "Closed" && <Note>Handled personally by Deborah. Nothing was sent from Pulse.</Note>}
    </Drawer>
  );
}

/* ── Shared draft editor ────────────────────────────────────────────────── */

function MatchedSlot({ c }: { c: ConvRow }) {
  const s = useClinic();
  const w = s.waitlist.find((x) => x.conversationId === c.id);
  const slot = w?.matchSlot ? F.SLOT_BY_ID[w.matchSlot] : undefined;
  if (!w || !slot) return null;
  return (
    <div className="c-note" style={{ alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        Waitlist offer. The Booking Agent matched {relDay(slot.date)} at {slot.start} ({slot.length} min, {dayLabel(slot.date)}) to {c.contactName}'s preference for {w.suitable.toLowerCase()}.
        Approving marks the offer sent in demo; confirming the booking happens in Bookings, Waitlist.
      </div>
      <Btn size="sm" onClick={() => go("Bookings", "waitlist")}>Open waitlist</Btn>
    </div>
  );
}

function DraftEditor({ c }: { c: ConvRow }) {
  const fid = "draft-text-" + c.id;
  const text = c.draft || "";
  const approve = () => {
    const r = approveDraft(c.id);
    if (!r.ok) toast(r.error);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {c.id === "CONV-01" && <MatchedSlot c={c} />}
      <Field label="Draft reply" htmlFor={fid} hint="Edit freely. Nothing is sent until you approve, and in the demo nothing leaves Pulse.">
        <textarea id={fid} className="c-textarea" value={text} onChange={(e) => editDraft(c.id, e.target.value)} rows={4} />
      </Field>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn variant="primary" onClick={approve} disabled={!text.trim()}>Approve</Btn>
        <Btn variant="danger" onClick={() => { rejectDraft(c.id); toast("Draft rejected. Moved to personal review for Deborah to reply herself."); }}>Reject</Btn>
        <Btn variant="ghost" onClick={() => regenerateDraft(c.id)}>Regenerate (demo)</Btn>
      </div>
    </div>
  );
}

/* ── Drafts ─────────────────────────────────────────────────────────────── */

function Drafts({ focus }: { focus: Focus }) {
  const s = useClinic();
  const drafts = openDrafts(s);
  const approved = s.conversations.filter((c) => c.state === "Sent in demo");
  const rejected = s.conversations.filter((c) => c.state === "Open" && c.draftState === "Rejected");
  const [hi, setHi] = useState<string | null>(focus?.id || null);

  useEffect(() => {
    if (!focus) return;
    setHi(focus.id);
    const t = setTimeout(() => document.getElementById("draft-" + focus.id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    return () => clearTimeout(t);
  }, [focus?.n, focus?.id]);

  return (
    <Page title="Drafts awaiting approval"
      sub={drafts.length + " drafts ready. The Inbox Assistant prepares them in Deborah's voice; nothing goes anywhere until she approves, and in the demo nothing leaves Pulse."}>
      <Grid cols="minmax(0,1.7fr) minmax(0,1fr)">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {drafts.length === 0 && (
            <Panel>
              <Empty title="Queue clear" action={<Btn onClick={() => go("Inbox", "conversations")}>Open conversations</Btn>}>Every draft has been approved or rejected.</Empty>
            </Panel>
          )}
          {drafts.map((c) => (
            <div id={"draft-" + c.id} key={c.id}>
              <Panel tint={hi === c.id} title={c.contactName}
                meta={c.channel + " · " + c.purpose + " · " + c.age + " ago"}
                actions={c.patientId ? <Btn size="sm" variant="ghost" onClick={() => openPatient(c.patientId!)}>Patient record</Btn> : undefined}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={quote}>{c.lastMessage}</p>
                  <DraftEditor c={c} />
                </div>
              </Panel>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Panel flush title="Recently approved" meta={approved.length ? String(approved.length) : "None yet"}>
            {approved.length === 0
              ? <div style={{ padding: "0 18px 16px", fontSize: 12.5, color: "var(--dim)" }}>Approved replies show here, marked sent in demo.</div>
              : (
                <div className="c-list">
                  {approved.map((c) => (
                    <div key={c.id} className="c-li" style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                        <span className="t grow c-ellipsis">{c.contactName}</span>
                        <Badge tone="ok">Sent in demo</Badge>
                      </div>
                      <div className="s" style={{ marginTop: 0 }}>{c.purpose}</div>
                      <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{c.sentText}</div>
                      <div className="s" style={{ marginTop: 0 }}>Sent in demo, nothing left Pulse.</div>
                      {c.id === "CONV-01" && <Btn size="sm" onClick={() => go("Bookings", "waitlist")}>Confirm booking in Waitlist</Btn>}
                    </div>
                  ))}
                </div>
              )}
          </Panel>
          {rejected.length > 0 && (
            <Panel flush title="Rejected" meta={String(rejected.length)}>
              <div className="c-list">
                {rejected.map((c) => (
                  <div key={c.id} className="c-li">
                    <div className="grow">
                      <div className="t">{c.contactName}</div>
                      <div className="s">{c.purpose} · moved to personal review</div>
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => go("Inbox", "conversations", c.id)}>Open</Btn>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          <Note>Clinical questions never get an AI draft. They are routed straight to Deborah under personal review.</Note>
        </div>
      </Grid>
    </Page>
  );
}

/* ── Response library ───────────────────────────────────────────────────── */

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied. Fill in anything in braces before you use it.");
  } catch {
    toast("Copying is not available here. Select the text and copy it instead.");
  }
}

function Library() {
  const groups = useMemo(() => {
    const order: string[] = [];
    const by: Record<string, typeof F.RESPONSE_LIBRARY> = {};
    for (const t of F.RESPONSE_LIBRARY) {
      if (!by[t.group]) { by[t.group] = []; order.push(t.group); }
      by[t.group].push(t);
    }
    return order.map((g) => ({ group: g, items: by[g] }));
  }, []);
  return (
    <Page title="Response library" sub={F.RESPONSE_LIBRARY.length + " saved replies in " + groups.length + " groups."}>
      <Note>Written in Deborah's voice: short, warm and plain, signed by her where it makes sense. The Inbox Assistant starts from these when drafting, and Deborah approves every reply. Words in braces, like {"{first}"}, are filled in per patient.</Note>
      <Grid cols="repeat(2,minmax(0,1fr))">
        {groups.map((g) => (
          <Panel key={g.group} flush title={g.group} meta={String(g.items.length)}>
            <div className="c-list">
              {g.items.map((t) => (
                <div key={t.id} className="c-li" style={{ alignItems: "flex-start" }}>
                  <div className="grow">
                    <div className="t">{t.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>{t.body}</div>
                  </div>
                  <Btn size="sm" onClick={() => { void copyText(t.body); }} title={"Copy " + t.title}>Copy</Btn>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </Grid>
    </Page>
  );
}
