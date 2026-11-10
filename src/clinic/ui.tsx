/* Shared building blocks for the clinic modules. Styling lives in
   src/styles/clinic.css and uses only Pulse theme tokens. Keep pages compact:
   no large decorative headers, no oversized KPI cards. */

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useUi } from "./store";

export function cls(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/** Page wrapper with a compact title row. */
export function Page({ title, sub, actions, children }: { title?: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="c-page">
      {(title || actions) && (
        <div className="c-head">
          <div style={{ minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="c-head-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/** CSS grid that collapses to one column under 980px. `cols` is a grid-template-columns value. */
export function Grid({ cols = "1fr 1fr", children, style }: { cols?: string; children: ReactNode; style?: CSSProperties }) {
  return <div className="c-grid" style={{ gridTemplateColumns: cols, ...style }}>{children}</div>;
}

export function Panel({ title, meta, actions, children, flush, tint, style }: {
  title?: ReactNode; meta?: ReactNode; actions?: ReactNode; children?: ReactNode; flush?: boolean; tint?: boolean; style?: CSSProperties;
}) {
  return (
    <section className={cls("c-panel", tint && "tint")} style={style}>
      {(title || actions || meta) && (
        <div className="c-panel-h">
          {title && <h3>{title}</h3>}
          {meta && <span className="c-meta">{meta}</span>}
          {actions && <div className="c-panel-actions">{actions}</div>}
        </div>
      )}
      <div className={cls("c-panel-b", flush && "flush")}>{children}</div>
    </section>
  );
}

export type Tone = "ok" | "warn" | "bad" | "accent" | "neutral" | "outline";
export function Badge({ tone = "neutral", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return <span className={cls("c-badge", tone !== "neutral" && tone)} title={title}>{children}</span>;
}

export function Stat({ label, value, note, tone, onClick }: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: "ok" | "warn" | "accent"; onClick?: () => void }) {
  const inner = (<><div className="l">{label}</div><div className="v">{value}</div>{note && <div className="n">{note}</div>}</>);
  return onClick
    ? <button type="button" className={cls("c-stat", tone)} onClick={onClick}>{inner}</button>
    : <div className={cls("c-stat", tone)}>{inner}</div>;
}
export function Stats({ children, min = 150 }: { children: ReactNode; min?: number }) {
  return <div className="c-stats" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(" + min + "px,1fr))" }}>{children}</div>;
}

export function Btn({ variant = "secondary", size, onClick, disabled, children, title, type = "button" }: {
  variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm"; onClick?: () => void; disabled?: boolean; children: ReactNode; title?: string; type?: "button" | "submit";
}) {
  return <button type={type} className={cls("c-btn", variant !== "secondary" && variant, size)} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

export interface Column<T> { key: string; label: ReactNode; render: (row: T) => ReactNode; num?: boolean; strong?: boolean; width?: string; hideSm?: boolean }
/** Table with optional row click and pagination. Rows must have a stable key. */
export function Table<T>({ columns, rows, rowKey, onRow, selected, pageSize, empty }: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRow?: (r: T) => void; selected?: string | null; pageSize?: number; empty?: ReactNode;
}) {
  const [page, setPage] = useState(0);
  const pages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  useEffect(() => { if (page > pages - 1) setPage(0); }, [pages, page]);
  const shown = pageSize ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows;
  if (!rows.length) return <div className="c-empty">{empty || "Nothing to show."}</div>;
  return (
    <>
      <div className="c-scroll-x">
        <table className="c-table">
          <thead><tr>{columns.map((c) => <th key={c.key} className={cls(c.num && "num", c.hideSm && "c-hide-sm")} style={c.width ? { width: c.width } : undefined}>{c.label}</th>)}</tr></thead>
          <tbody>
            {shown.map((r) => {
              const k = rowKey(r);
              return (
                <tr key={k} className={cls(onRow && "c-row", selected === k && "sel")} tabIndex={onRow ? 0 : undefined}
                  onClick={onRow ? () => onRow(r) : undefined}
                  onKeyDown={onRow ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRow(r); } } : undefined}>
                  {columns.map((c) => <td key={c.key} className={cls(c.num && "num", c.strong && "strong", c.hideSm && "c-hide-sm")}>{c.render(r)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageSize && pages > 1 && (
        <div className="c-pager">
          <span>{page * pageSize + 1} to {Math.min(rows.length, (page + 1) * pageSize)} of {rows.length}</span>
          <span className="sp" />
          <Btn size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</Btn>
          <Btn size="sm" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>Next</Btn>
        </div>
      )}
    </>
  );
}

export function Drawer({ open, onClose, title, sub, children, footer, width }: {
  open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="c-drawer-scrim" onClick={onClose} />
      <aside className="c-drawer" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Details"} style={width ? { width: "min(" + width + "px,calc(100vw - 24px))" } : undefined}>
        <div className="c-drawer-h">
          <div style={{ minWidth: 0 }}>
            <h3>{title}</h3>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <button type="button" className="c-x c-focus" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="c-drawer-b">{children}</div>
        {footer && <div className="c-drawer-f">{footer}</div>}
      </aside>
    </>
  );
}

export function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string; count?: number | string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="c-tabs" role="tablist">
      {items.map((it) => (
        <button key={it.id} type="button" role="tab" aria-selected={value === it.id} className="c-tab" onClick={() => onChange(it.id)}>
          {it.label}{it.count !== undefined && <span className="cnt">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="c-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  );
}

export function Search({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label?: string }) {
  return (
    <div className="c-search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="m21 21-4.3-4.3 M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0" /></svg>
      <input className="c-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="c-toggle" onClick={() => onChange(!checked)} />;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="c-empty"><div className="t">{title}</div>{children}{action && <div style={{ marginTop: 12 }}>{action}</div>}</div>;
}

export function Note({ children, tone }: { children: ReactNode; tone?: "warn" }) {
  return (
    <div className={cls("c-note", tone)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flex: "none", marginTop: 2 }}><path d="M12 8h.01 M11 12h1v4h1 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /></svg>
      <div>{children}</div>
    </div>
  );
}

export function Kv({ items }: { items: [ReactNode, ReactNode][] }) {
  return <dl className="c-kv">{items.map(([k, v], i) => <div key={i} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

/** Horizontal bars with no background track. */
export function BarList({ items, format }: { items: { label: string; value: number; muted?: boolean }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="c-bars">
      {items.map((it, k) => (
        <div className="c-bar" key={it.label}>
          <span className="lab" title={it.label}>{it.label}</span>
          <span><span className={cls("fill", it.muted && "muted")} style={{ display: "block", width: Math.max(2, (it.value / max) * 100) + "%", animationDelay: k * 40 + "ms" }} /></span>
          <span className="val">{format ? format(it.value) : it.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Small vertical column chart. */
export function Columns({ items, format, height = 130 }: { items: { label: string; value: number; muted?: boolean }[]; format?: (n: number) => string; height?: number }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="c-cols" style={{ height }}>
      {items.map((it, k) => (
        <div className="c-col" key={it.label + k}>
          <span className="y">{format ? format(it.value) : it.value}</span>
          <span className={cls("b", it.muted && "muted")} style={{ height: Math.max(3, (it.value / max) * (height - 44)) + "px", animationDelay: k * 40 + "ms" }} />
          <span className="x">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const p = max ? Math.round((value / max) * 100) : 0;
  return <div className="c-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}><span style={{ width: p + "%" }} /></div>;
}

export function Avatar({ name }: { name: string }) {
  const init = useMemo(() => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(), [name]);
  return <span className="c-avatar" aria-hidden="true">{init}</span>;
}

/** One-line confirmation shown after demo actions. */
export function ToastHost() {
  const ui = useUi();
  if (!ui.toast) return null;
  return <div className="c-toast" role="status" key={ui.toastSeq}>{ui.toast}</div>;
}

/** Inline marker for anything fictional or simulated. */
export function DemoTag({ children = "Fictional" }: { children?: ReactNode }) {
  return <Badge tone="outline">{children}</Badge>;
}
