/* Records → Registry: compact reference data. Each section points to the
   module where that data is actually worked on, rather than duplicating it. */

import * as F from "../fixtures";
import { eur, plural } from "../format";
import { useClinic, go } from "../store";
import { Page, Grid, Panel, Badge, Btn, Table, Kv, Note, DemoTag, type Tone } from "../ui";

const roomName = (id: F.RoomId) => F.ROOMS.find((r) => r.id === id)?.name || id;
const stateTone: Record<F.PersonState, Tone> = { Active: "ok", Planned: "warn", "Not invited": "neutral" };

export default function Registry(_props: { v?: unknown; tab?: string }) {
  const s = useClinic();
  const inArea = (area: string) => s.patients.filter((p) => p.locality === area).length;

  return (
    <Page>
      <Note>Reference data for the clinic. Prices, suppliers and figures are fictional demo values. Each section links to where the work happens.</Note>

      <Grid cols="1.6fr 1fr">
        <Panel title="Services catalogue" meta={<DemoTag>Illustrative prices</DemoTag>} flush
          actions={<Btn size="sm" onClick={() => go("Bookings", "online")}>Online booking</Btn>}>
          <Table<F.Service>
            rows={F.SERVICES}
            rowKey={(r) => r.id}
            columns={[
              { key: "n", label: "Service", strong: true, render: (r) => r.name },
              { key: "p", label: "Price", num: true, render: (r) => (r.price ? eur(r.price) : "No charge") },
              { key: "d", label: "Length", num: true, render: (r) => r.duration + " min" },
              { key: "t", label: "Turnover", num: true, hideSm: true, render: (r) => (r.turnover ? r.turnover + " min" : "None") },
              { key: "r", label: "Room", hideSm: true, render: (r) => roomName(r.room) },
              { key: "f", label: "New patients", hideSm: true, render: (r) => (r.forNewPatients ? "Bookable" : "Returning only") },
            ]}
          />
          <div className="c-list" style={{ borderTop: "1px solid var(--border)" }}>
            {F.EXPANSION_SERVICES.map((e) => (
              <div key={e.name} className="c-li">
                <div className="grow"><div className="t">{e.name}</div><div className="s">{e.note}</div></div>
                <Badge tone="warn">Planned only</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Identity" meta="From what Deborah has shared"
          actions={<Btn size="sm" onClick={() => go("Settings", "org")}>Organisation</Btn>}>
          <Kv items={[
            ["Legal name", F.ORG.legalName],
            ["Structure", F.ORG.structure],
            ["Trading name", <Badge tone="warn">{F.ORG.tradingName}</Badge>],
            ["Profession", F.ORG.profession],
            ["Location", F.ORG.location],
            ["Premises", F.ORG.premises],
            ["Website", <><Badge tone="warn">{F.ORG.website}</Badge><div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>{F.ORG.websiteNote}</div></>],
            ["Business email", F.ORG.businessEmail],
          ]} />
        </Panel>
      </Grid>

      <Grid cols="1.6fr 1fr">
        <Panel title="People" meta={plural(F.PEOPLE.filter((p) => p.state === "Active").length, "active user")} flush
          actions={<Btn size="sm" onClick={() => go("Settings", "people")}>People & permissions</Btn>}>
          <Table<F.Person>
            rows={F.PEOPLE}
            rowKey={(r) => r.id}
            columns={[
              { key: "n", label: "Name", strong: true, render: (r) => r.name },
              { key: "r", label: "Role", hideSm: true, render: (r) => r.role },
              { key: "s", label: "State", render: (r) => <Badge tone={stateTone[r.state]}>{r.state}</Badge> },
              { key: "a", label: "Access", hideSm: true, render: (r) => r.access },
            ]}
          />
        </Panel>

        <Panel title="Clinic hours" meta="Configured, not reported"
          actions={<Btn size="sm" onClick={() => go("Bookings", "calendar")}>Calendar</Btn>}>
          <Kv items={[
            ["Clinic days", F.HOURS.days.join(", ")],
            ["Hours", F.HOURS.open + " to " + F.HOURS.close],
            ["Breaks", F.HOURS.breaks.map((b) => b.label + " " + b.start + " to " + b.end).join(", ")],
          ]} />
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>{F.HOURS.note}</p>
        </Panel>
      </Grid>

      <Grid cols="1fr 1fr 1fr">
        <Panel title="Rooms and practitioners" flush
          actions={<Btn size="sm" onClick={() => go("Bookings", "capacity")}>Capacity</Btn>}>
          <div className="c-list">
            {F.ROOMS.map((r) => (
              <div key={r.id} className="c-li">
                <div className="grow"><div className="t">{r.name}</div><div className="s">{r.note}</div></div>
                <Badge tone="outline">Room</Badge>
              </div>
            ))}
            {F.PRACTITIONERS.map((p) => (
              <div key={p.id} className="c-li">
                <div className="grow"><div className="t">{p.name}</div><div className="s">{p.active ? "Takes bookings on clinic days" : "No diary, no access"}</div></div>
                <Badge tone={p.active ? "ok" : "warn"}>{p.active ? "Active" : "Planned"}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Suppliers" meta={<DemoTag>Fictional</DemoTag>} flush
          actions={<Btn size="sm" onClick={() => go("Finance", "transactions")}>Transactions</Btn>}>
          <div className="c-list">
            {F.SUPPLIERS.map((x) => (
              <div key={x.id} className="c-li">
                <div className="grow"><div className="t c-ellipsis">{x.name}</div><div className="s">{x.supplies}</div></div>
                <span style={{ fontSize: 11.5, color: "var(--dim)", whiteSpace: "nowrap" }}>{x.terms}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Target localities" meta="Patients on record" flush
          actions={<Btn size="sm" onClick={() => go("Marketing", "local")}>Local growth</Btn>}>
          <div className="c-list">
            {F.TARGET_AREAS.map((a) => (
              <div key={a} className="c-li">
                <span className="grow t">{a}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{inArea(a)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </Grid>
    </Page>
  );
}
