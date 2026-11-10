/* Pulse data for the Deborah Gough demo (Aesthetics Clinic · Milltown). All records are fictional.
   Clinic records live in src/clinic/fixtures.ts; this file keeps Pulse's own shapes. */
import { clinicAnswer } from "../clinic/answers";

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  navBookings:"M8 3.8v3 M16 3.8v3 M4.5 9.4h15 M6.4 5.8h11.2A1.9 1.9 0 0 1 19.5 7.7v10.4a1.9 1.9 0 0 1-1.9 1.9H6.4a1.9 1.9 0 0 1-1.9-1.9V7.7a1.9 1.9 0 0 1 1.9-1.9Z M8.4 13.2h2.4 M13.2 13.2h2.4 M8.4 16.4h2.4",
  navPatients:"M9.2 11.6a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z M3.2 19.8c.7-3 3.1-4.7 6-4.7s5.3 1.7 6 4.7 M16.4 5.6a3 3 0 0 1 0 5.8 M18 15.4c1.6.5 2.6 1.9 3 4.2",
  navInbox:"M3.5 13h4.2l1.4 2.8h5.8l1.4-2.8h4.2 M3.5 13l2.3-6.6A1.9 1.9 0 0 1 7.6 5h8.8a1.9 1.9 0 0 1 1.8 1.4L20.5 13v4.6a1.9 1.9 0 0 1-1.9 1.9H5.4a1.9 1.9 0 0 1-1.9-1.9V13Z",
  navMarketing:"M4 10.2v3.6a1 1 0 0 0 1 1h2.4l6.1 4V5.2l-6.1 4H5a1 1 0 0 0-1 1Z M16.6 9a4 4 0 0 1 0 6 M18.9 6.6a7.4 7.4 0 0 1 0 10.8",
  navFinance:"M4.5 7.2h15a1.5 1.5 0 0 1 1.5 1.5v8.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.3V8.7a1.5 1.5 0 0 1 1.5-1.5Z M3 10.8h18 M6.5 15h3.4 M15.2 4.8H6.4"
};


/* Ontology stays first and is never removed (PulseLogic enforces this too).
   "files" keeps its id so the existing file tree drives Documents. */
const REC_SECTIONS = [
  {id:"ontology", label:"Ontology", blurb:"How every clinic record connects: patients, appointments, services, payments, messages and approvals."},
  {id:"registry", label:"Registry", blurb:"Services, suppliers, people, rooms and other reference data the clinic runs on."},
  {id:"files", label:"Documents", blurb:"Fictional intake forms, consent-document references, receipts and SOPs. Placeholders only."}
];

/* Fictional contacts (demo data). */
const CONTACTS = [
  ["Deborah Gough","Owner and practitioner","Not supplied","Deborah Gough","owner","var(--accent)"],
  ["Emma Byrne","Prospective practitioner (planned)","Fictional placeholder","Deborah Gough","planned","#9DBBB4"],
  ["Accountant","External reviewer (not invited)","Name not supplied","External","external","#c49a6c"],
  ["Liffey Clinical Supplies","Supplier (fictional)","orders@supplier.example","Supplier","supplier","#7fb3d5"],
  ["Northbank Skin Wholesale","Supplier (fictional)","sales@supplier.example","Supplier","supplier","#9b8ad8"]
];

/* Documents tab. Every file is a fictional placeholder; no patient content is shown. */
const FILE_TREE = [
  {type:"folder", id:"f-forms", name:"Intake forms", depth:0},
  {type:"file", id:"fl-1", name:"Intake form · Sarah Byrne (incomplete).pdf", depth:1, parent:"f-forms", indexed:true,
   path:"Intake forms / PAT-118", title:"Intake form · Sarah Byrne",
   facts:[["TYPE","Form placeholder"],["RECEIVED","8 Nov 2026"],["STATUS","Incomplete"],["PATIENT","PAT-118"]],
   body:["Placeholder for a fictional intake form. The medical-history section has not been submitted, which is why a preparation check is open.",
     "Pulse tracks whether the form is complete. It never interprets the answers."],
   links:[["Sarah Byrne","person"],["Preparation check PREP-01","workflow"]]},
  {type:"file", id:"fl-2", name:"Intake form · Niamh Kelly.pdf", depth:1, parent:"f-forms", indexed:true,
   path:"Intake forms / PAT-072", title:"Intake form · Niamh Kelly",
   facts:[["TYPE","Form placeholder"],["RECEIVED","11 Jun 2026"],["STATUS","On file"],["PATIENT","PAT-072"]],
   body:["Placeholder for a completed fictional intake form."],
   links:[["Niamh Kelly","person"]]},
  {type:"folder", id:"f-consent", name:"Consent-document references", depth:0},
  {type:"file", id:"fl-3", name:"Consent reference · Orla Walsh.pdf", depth:1, parent:"f-consent", indexed:false,
   path:"Consent references / PAT-093", title:"Consent reference · Orla Walsh",
   facts:[["TYPE","Reference only"],["DATED","20 Oct 2026"],["STATUS","Review needed"],["PATIENT","PAT-093"]],
   body:["A reference to a consent document held by Deborah. Its contents are not shown or indexed in the demo.",
     "A review task is open before Thursday's appointment."],
   links:[["Orla Walsh","person"],["Task TSK-03","workflow"]]},
  {type:"folder", id:"f-receipts", name:"Receipts", depth:0},
  {type:"file", id:"fl-4", name:"Receipt · Liffey Clinical Supplies, 3 Oct.pdf", depth:1, parent:"f-receipts", indexed:true,
   path:"Receipts / October 2026", title:"Receipt · Liffey Clinical Supplies",
   facts:[["TYPE","Receipt"],["AMOUNT","€860"],["DATE","3 Oct 2026"],["SUPPLIER","Fictional"]],
   body:["Consumables order. Matched to the October expense row in Finance."],
   links:[["Accountant pack","workflow"]]},
  {type:"file", id:"fl-5", name:"Receipt · Liffey Clinical Supplies, 14 Oct (missing)", depth:1, parent:"f-receipts", indexed:false,
   path:"Receipts / October 2026", title:"Receipt missing · 14 Oct",
   facts:[["TYPE","Missing receipt"],["AMOUNT","€740"],["DATE","14 Oct 2026"],["NEEDED FOR","Accountant pack"]],
   body:["The expense is recorded but no receipt is on file yet. It is listed in the accountant pack's missing-document list."],
   links:[["Accountant pack","workflow"]]},
  {type:"folder", id:"f-sop", name:"SOPs", depth:0},
  {type:"file", id:"fl-6", name:"SOP · Opening and closing the clinic.pdf", depth:1, parent:"f-sop", indexed:true,
   path:"SOPs", title:"SOP · Opening and closing the clinic",
   facts:[["TYPE","SOP"],["UPDATED","1 Sep 2026"],["OWNER","Deborah Gough"],["STATUS","On file"]],
   body:["Room set-up, five minutes' turnover after treatments, and lock-up for the shared premises."],
   links:[["Treatment room","location"]]},
  {type:"file", id:"fl-7", name:"SOP · Patient handover between practitioners (draft).pdf", depth:1, parent:"f-sop", indexed:true,
   path:"SOPs", title:"SOP · Patient handover (draft)",
   facts:[["TYPE","SOP draft"],["UPDATED","2 Nov 2026"],["OWNER","Deborah Gough"],["STATUS","Draft"]],
   body:["Written ahead of the planned second practitioner. Part of the onboarding checklist."],
   links:[["Practitioner onboarding","workflow"]]}
];

/* Ontology labels for the clinic. */
const ONTO_NODES = [
  ["Patient","entity",500,300,1,"A fictional patient record: contact preference, locality, forms and history."],
  ["Appointment","entity",700,190,1,"A booked slot with a service, practitioner and room."],
  ["Service","entity",860,300,0,"Illustrative catalogue: consultation, skin review, microneedling, hair and scalp, follow-up."],
  ["Practitioner","entity",860,110,0,"Deborah today; a planned second practitioner as a scenario only."],
  ["Room","entity",700,60,0,"Treatment room shared with the plastic surgeon, and a consult room."],
  ["Conversation","entity",300,190,1,"Messages and drafts. Clinical questions always go to Deborah."],
  ["Receipt","ledger",300,430,0,"Received funds from the Revolut demo import, allocated to a patient and appointment."],
  ["Task","entity",500,470,0,"Work linked to any record."],
  ["Content","module",140,300,0,"Posts in the planner, linked to a proposed campaign."],
  ["Campaign","module",140,430,0,"A draft paid campaign with €0 spent."],
  ["Agent run","entity",690,430,0,"What an agent looked at and what it proposed."],
  ["Approval","entity",860,470,0,"Deborah's yes or no. Nothing with an effect happens without one."],
  ["books","predicate",600,245,0,"Patient → Appointment."],
  ["is for","predicate",780,245,0,"Appointment → Service."],
  ["pays","predicate",400,370,0,"Receipt → Patient / Appointment."],
  ["proposes","predicate",780,450,0,"Agent run → Proposed action → Approval."]
];

const ONTO_EDGES = [
  [500,300,700,190],[700,190,860,300],[700,190,860,110],[700,190,700,60],
  [500,300,300,190],[300,430,500,300],[300,430,700,190],[500,470,500,300],
  [140,300,140,430],[690,430,860,470],[500,470,690,430],[300,190,690,430]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid, the default for a person, organisation or location.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a case or a claim.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status, built to be sent, not just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images and files with a caption on each, for a site or a job.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of places, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];


/* ---- admin (legacy settings model; the clinic Settings page replaces its UI) ---- */
const PEOPLE = [
  ["Deborah Gough","Owner and practitioner","Not supplied","Milltown","active","Admin","Now"],
  ["Emma Byrne","Prospective practitioner (fictional placeholder)","No account","Milltown","inactive","Standard","Never"],
  ["Accountant","External reviewer (name not supplied)","Not invited","External","inactive","External","Never"]
];

const ROLE_LEVELS = ["Admin","Manager","Standard","External"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve payments"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Say yes to parked work"],
  ["pay","Release payments","Send money out"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Modules, roles, integrations"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their location","Assigned only"];
const DEFAULT_PERMS = {Admin:{view:true,edit:true,approve:true}, Manager:{view:true,edit:true,approve:true},
  Standard:{view:true,edit:true,approve:false}, External:{view:true,edit:false,approve:false}};

/* Integration states. None of these is live; see src/clinic/fixtures.ts INTEGRATIONS. */
const INTEGRATIONS = [
  {name:"Instagram", blurb:"Current acquisition and messaging channel. Simulated in the demo.", tint:"#9b8ad8", status:"simulated", statusKind:"warn",
   glyph:"M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5Z M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
   lastSync:"Demo data", usage:"12 conversations", auth:"Not configured", scopes:[]},
  {name:"Google Calendar", blurb:"Current appointment calendar. Import and sync preview only.", tint:"#7fb3d5", status:"simulated", statusKind:"warn",
   glyph:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z",
   lastSync:"Demo data", usage:"Preview", auth:"Not configured", scopes:[]},
  {name:"Revolut", blurb:"Sample CSV import and payment matching. Account type unconfirmed.", tint:"#c49a6c", status:"manual import", statusKind:"warn",
   glyph:"M4.5 7.2h15a1.5 1.5 0 0 1 1.5 1.5v8.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.3V8.7a1.5 1.5 0 0 1 1.5-1.5Z M3 10.8h18",
   lastSync:"Demo import", usage:"Sample CSV", auth:"None", scopes:[]}
];


const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"milltown", label:"Milltown", group:"Light", bg:"#EFF5F2", surface:"#ffffff", ink:"#243735", accent:"#345B57"},
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Harbour", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#5ee79a"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Cream", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#0071e3"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};


const ADMIN_CARDS = [
  {id:"people", group:"ORGANISATION", title:"People & access", icon:"people", tint:"#9DBBB4",
   blurb:"One active owner. Planned roles are not employees.", tags:["1 active","1 planned","1 not invited"],
   footer:"Demo only", action:"Open", listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Active owner","Deborah Gough"],["Planned practitioner","No access"],["External accountant","Not invited"]]},
  {id:"teams", group:"CONTROL", title:"Approvals", icon:"shield", tint:"var(--accent)",
   blurb:"Anything with an effect waits for Deborah.", tags:["Draft-first"],
   footer:"Demo only", action:"Open", listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Messages","Review before sending"],["Payment matches","Approve allocation"],["Posts","Approve publication"]]},
  {id:"systems", group:"SYSTEMS", title:"Systems", icon:"plug", tint:"#7fb3d5",
   blurb:"Current tools and proposed connections. Nothing is live.", tags:["Simulated"],
   footer:"Demo only", action:"Open", listLabel:"STATES", rows:[["Instagram","Simulated"],["Google Calendar","Simulated"],["Revolut","Manual import preview"]]},
  {id:"audit", group:"GOVERNANCE", title:"Audit", icon:"audit", tint:"#c49a6c",
   blurb:"Every demo action is written to Activity.", tags:["Local only"],
   footer:"Demo only", action:"Open", listLabel:"WHAT IS RECORDED", rows:[["Your actions","Yes"],["Agent proposals","Yes"],["Imports","Yes"]]},
  {id:"structure", group:"EXPERIENCE", title:"Appearance", icon:"brand", tint:"#345B57",
   tags:["Milltown theme"], listLabel:"THEMES", rows:[]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(3,1fr)"],
  ["CONTROL", "repeat(3,1fr)"],
  ["SYSTEMS", "repeat(3,1fr)"],
  ["GOVERNANCE", "repeat(3,1fr)"],
  ["EXPERIENCE", "repeat(3,1fr)"]
];


/* ---- activity feeds (legacy live-stream model; the clinic Activity page replaces its UI) ---- */
const SRC_TINT = {Instagram:"#9b8ad8", Pulse:"var(--accent)", Revolut:"#c49a6c", WhatsApp:"#5fe0a8", Calendar:"#7fb3d5", Agent:"var(--accent)"};
const SRC_ABBR = {Instagram:"IG", Pulse:"PL", Revolut:"RV", WhatsApp:"WA", Calendar:"GC", Agent:"AI"};

const DATA_EVENTS = [
  ["Demo import","Eight Revolut receipts added from the sample CSV.","Demo import","Finance","Revolut","completed"],
  ["Calendar preview","This week's appointments loaded from the calendar import preview.","Demo import","Bookings","Calendar","completed"]
];
const PEOPLE_EVENTS = [
  ["Deborah approved a draft","An appointment-response draft was marked sent in demo.","Deborah Gough","Inbox","Pulse","completed"],
  ["Onboarding updated","Practitioner onboarding reached 60%.","Deborah Gough","Work","Pulse","completed"]
];
const AI_EVENTS = [
  ["Booking Agent","Two available slots matched to the waitlist.","Booking Agent","Bookings","Agent","completed"],
  ["Finance Agent","Proposed a match for €180.","Finance Agent","Finance","Agent","completed"]
];

const STREAM_DEFS = [
  {id:"data", title:"Imported", sub:"Demo imports", pool:DATA_EVENTS, every:3200000,
   tint:"#7fb3d5", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9"},
  {id:"people", title:"Your actions", sub:"Decisions Deborah made", pool:PEOPLE_EVENTS, every:6400000,
   tint:"#c49a6c", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"Agent proposals", sub:"Agents at work", pool:AI_EVENTS, every:4600000,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

/* The twelve modules. PulseLogic keeps Agents directly under Home (locked layout);
   Activity sits below a divider, Settings lives in the rail footer. */
const NAV = [
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Bookings", icon:"navBookings", page:"Bookings"},
  {label:"Patients", icon:"navPatients", page:"Patients"},
  {label:"Inbox", icon:"navInbox", page:"Inbox", dot:true},
  {label:"Marketing", icon:"navMarketing", page:"Marketing"},
  {label:"Finance", icon:"navFinance", page:"Finance"},
  {label:"Dashboard", icon:"navDash", page:"Dashboard"},
  {label:"Work", icon:"navWork", page:"Work"},
  {label:"Records", icon:"navRecords", page:"Records"},
  {divider:true},
  {label:"Activity", icon:"pulseLine", page:"Activity"}
];

/* Home inbox items. Counts and wording are refreshed from the live demo records
   by src/clinic/bridge.ts; these are the shapes. */
const ITEMS = {
  slots:{kind:"Bookings", importance:"high", icon:ICONS.navBookings, age:"07:45", title:"Two open slots today", why:"Six patients on the waitlist.", detail:"", actionLabel:"Open waitlist", secondaryLabel:"Later", group:"Work", fields:[], history:[]},
  receipts:{kind:"Finance", importance:"high", icon:ICONS.navFinance, age:"07:31", title:"Eight receipts to match", why:"€1,240 received, awaiting allocation.", detail:"", actionLabel:"Match", secondaryLabel:"Later", group:"Approvals", fields:[], history:[]},
  drafts:{kind:"Inbox", importance:"normal", icon:ICONS.navInbox, age:"07:20", title:"Eight message drafts", why:"Three conversations need you personally.", detail:"", actionLabel:"Review", secondaryLabel:"Later", group:"Approvals", fields:[], history:[]},
  prep:{kind:"Patients", importance:"normal", icon:ICONS.navPatients, age:"07:10", title:"Four preparation checks", why:"Administrative checks before upcoming appointments.", detail:"", actionLabel:"Open", secondaryLabel:"Later", group:"Work", fields:[], history:[]},
  posts:{kind:"Marketing", importance:"normal", icon:ICONS.navMarketing, age:"Mon", title:"Five posts to approve", why:"Nothing is published without your yes.", detail:"", actionLabel:"Review", secondaryLabel:"Later", group:"Approvals", fields:[], history:[]}
};
const ORDER = ["slots","receipts","drafts","prep","posts"];

/* Home chat answers are built from the live demo records (no model is called). */
const ANSWERS = {};

function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Site coverage"], unit:"EUR, 30 DAYS"},
    cost:     {labels:["Spend","Cost per job","Savings found","Budget used"], unit:"EUR, 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY, 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u2014 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u2014 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d \u2014 a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}


function pickAnswer(q){
  return clinicAnswer(q);
}

/* Suppliers stand in for the old organisation list (fictional names). */
const ORGS = [
  ["Liffey Clinical Supplies (fictional)","Supplier","€0","-","active"],
  ["Northbank Skin Wholesale (fictional)","Supplier","€0","-","active"],
  ["Room landlord (fictional)","Supplier","€0","-","active"]
];
const TEAMS = [
  ["Clinical","Work area","Deborah Gough","-"],
  ["Administration","Work area","Deborah Gough","-"],
  ["Marketing","Work area","Deborah Gough","-"],
  ["Finance","Work area","Deborah Gough","-"]
];
const LOCATIONS = [
  ["Clinic","Milltown, Dublin (near the Eurospar)","Shared premises","active"]
];

/* Agents overview (chat-style). Seven practical agents; each one drafts or
   proposes and waits for Deborah. Threads describe the 08:30 demo snapshot. */
const AGENT_DEFS = [
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#16241f", state:"complete", role:"Summarises today, money and outstanding work. Read-only.",
   when:"08:00", preview:"18 appointments, 2 open slots, €1,240 to match.",
   thread:[
     {kind:"stamp", text:"Today 08:00"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"morning briefing:", lines:[
       {k:"Today", v:"18 appointments · 2 open slots (14:00, 16:00)"},
       {k:"Money", v:"8 received payments, €1,240, awaiting allocation"},
       {k:"Inbox", v:"8 drafts ready · 3 for you personally"},
       {k:"Prep", v:"4 upcoming appointments need admin checks"}]},
     {kind:"agent", text:"the quickest win is the 14:00 slot: Aoife Murphy is on the waitlist and wants weekday afternoons. the offer is drafted and waiting for you."}
   ]},
  {id:"ops", name:"Ops Watchdog", shape:"shield", tint:"#191c1f", state:"working", role:"Detects clashes, incomplete preparation and excess workload. Proposes tasks.",
   when:"07:00", preview:"no clashes. 54 of 60 slots booked.",
   thread:[
     {kind:"stamp", text:"Today 07:00"},
     {kind:"agent", text:"this week is 54 of 60 slots, 90% slot utilisation. no double bookings and nothing outside 09:00 to 19:00."},
     {kind:"agent", text:"i would not open extra hours. the six open slots can be filled from the waitlist instead."}
   ]},
  {id:"booking", name:"Booking Agent", shape:"executive-capsule", tint:"#1b2430", state:"waiting", role:"Suggests valid slots and waitlist matches. Offers and changes need your approval.",
   when:"07:45", preview:"SLOT-101 matched to Aoife Murphy. waiting on you.",
   thread:[
     {kind:"stamp", text:"Today 07:45"},
     {kind:"agent", text:"two 30-minute consultation gaps today: SLOT-101 at 14:00 and SLOT-102 at 16:00."},
     {kind:"agent", text:"Aoife Murphy (PAT-041) has been waiting since 4 Nov for a weekday afternoon. i've drafted the offer for 14:00. it goes nowhere until you approve it."}
   ]},
  {id:"inbox", name:"Inbox Assistant", shape:"offset-pebble", tint:"#241b2e", state:"waiting", role:"Drafts administrative replies in your voice. Every reply is reviewed before sending.",
   when:"07:20", preview:"8 drafts ready. 1 clinical question left for you.",
   thread:[
     {kind:"stamp", text:"Today 07:20"},
     {kind:"agent", text:"12 open conversations: 8 drafts ready, 3 for you personally, 1 waiting on the patient."},
     {kind:"agent", text:"one message asks about medication before microneedling. that is a clinical question, so i routed it to you and wrote nothing."}
   ]},
  {id:"finance", name:"Finance Agent", shape:"control-cube", tint:"#2a2118", state:"waiting", role:"Suggests payment matches and flags missing receipts. Allocation needs your approval.",
   when:"07:31", preview:"€180 likely Niamh Kelly. 4 October receipts missing.",
   thread:[
     {kind:"stamp", text:"Today 07:31"},
     {kind:"agent", text:"the demo import added eight receipts, €1,240 in total. these are funds already received, not unpaid invoices."},
     {kind:"agent", text:"one is a confident match: reference KELLY N, €180, Niamh Kelly's microneedling on 5 Nov. approving records the allocation only; nothing is counted twice."}
   ]},
  {id:"content", name:"Content Assistant", shape:"low-dome", tint:"#16241f", state:"complete", role:"Prepares captions and scheduling suggestions. Publication needs your approval.",
   when:"Mon", preview:"5 posts ready for review.",
   thread:[
     {kind:"stamp", text:"Monday 20:00"},
     {kind:"agent", text:"five posts are ready: meet Deborah, finding the clinic, behind the scenes, consultation FAQs and this week's availability. nothing uses patient records or photos."}
   ]},
  {id:"admin", name:"Patient Admin Agent", shape:"glass-visor", tint:"#2b1b1e", state:"attention", role:"Tracks forms and administrative follow-ups. No clinical decisions.",
   when:"07:10", preview:"Sarah Byrne's intake form is incomplete.",
   thread:[
     {kind:"stamp", text:"Today 07:10"},
     {kind:"agent", text:"four upcoming appointments need admin checks: Sarah Byrne's intake form, Orla Walsh's consent-document review, a missing mobile number and an unreturned questionnaire."},
     {kind:"agent", text:"these are paperwork checks only. anything clinical stays with you."}
   ]}
];

/* KPI band on Dashboard → Clinic. Values are refreshed from the live demo
   records by src/clinic/bridge.ts every render. */
const KPI_DEFS = {
  week:{label:"Booked this week", value:"54 of 60", delta:"90%", dir:"up", hint:"slot utilisation", hero:true},
  today:{label:"Today", value:"18", delta:"2 open", dir:"up", hint:"appointments"},
  receipts:{label:"Receipts to match", value:"€1,240", delta:"8 receipts", dir:"up", hint:"received, awaiting allocation"},
  drafts:{label:"Drafts ready", value:"8", delta:"3 personal", dir:"up", hint:"of 12 open conversations"},
  local:{label:"Local share", value:"50%", delta:"9 of 18", dir:"up", hint:"new patients, target areas"},
  prep:{label:"Preparation checks", value:"4", delta:"outstanding", dir:"down", hint:"upcoming appointments"},
  posts:{label:"Posts to approve", value:"5", delta:"in library", dir:"up", hint:"nothing published"},
  surplus:{label:"October surplus", value:"€10,500", delta:"before tax", dir:"up", hint:"€16,800 less €6,300"}
};

/* Legacy dashboard areas (command palette "Pages"); fictional demo values. */
const ASPECT_DEFS = [
  {id:"bookings", label:"Bookings", color:"var(--accent)", owner:"DEBORAH GOUGH", description:"Appointments, open slots and the waitlist.",
   kind:"columns", chartTitle:"Booked slots by clinic day", chartUnit:"SLOTS",
   chart:[["Tue 3",20,"20"],["Thu 5",20,"20"],["Fri 6",20,"20"],["Tue 10",18,"18"],["Thu 12",18,"18"],["Fri 13",18,"18"]],
   splitTitle:"This week", split:[["Booked","54","90%",1],["Open","6","10%",0]],
   tableCols:["Day","Booked","Open","Capacity"], table:[["Tue 10 Nov","18","2","20"],["Thu 12 Nov","18","2","20"],["Fri 13 Nov","18","2","20"]],
   metrics:[["Booked","54","90%","up","this week",[.9,.9,.9,.9,.9,.9,.9,.9,.9]],["Open","6","10%","up","this week",[.1,.1,.1,.1,.1,.1,.1,.1,.1]],["Waitlist","6","","up","patients",[.5,.5,.5,.5,.5,.5,.5,.5,.6]],["New","18","","up","patients",[.4,.5,.5,.6,.6,.6,.7,.7,.8]]]},
  {id:"finance", label:"Finance", color:"#c49a6c", owner:"DEBORAH GOUGH", description:"October revenue, costs and the reconciliation queue.",
   kind:"columns", chartTitle:"October by area", chartUnit:"EUR",
   chart:[["Consults",2400,"€2.4k"],["Skin",9600,"€9.6k"],["Hair",4800,"€4.8k"]],
   splitTitle:"October", split:[["Revenue","€16,800","100%",1],["Costs","€6,300","38%",0]],
   tableCols:["Item","Amount","Share","Note"], table:[["Revenue","€16,800","100%","Recorded"],["Costs","€6,300","38%","Recorded"],["Surplus","€10,500","62%","Before tax and drawings"]],
   metrics:[["Revenue","€16,800","","up","October",[.5,.5,.5,.5,.5,.5,.5,.5,.5]],["Costs","€6,300","","down","October",[.3,.3,.3,.3,.3,.3,.3,.3,.3]],["Surplus","€10,500","","up","October",[.4,.4,.4,.4,.4,.4,.4,.4,.4]],["To match","€1,240","","down","November",[.2,.2,.2,.2,.2,.2,.2,.2,.2]]]},
  {id:"marketing", label:"Marketing", color:"#9DBBB4", owner:"DEBORAH GOUGH", description:"Content readiness and local patient share.",
   kind:"columns", chartTitle:"New patients by area", chartUnit:"PATIENTS",
   chart:[["Milltown",3,"3"],["Dundrum",2,"2"],["Blackrock",2,"2"],["Deansgrange",1,"1"],["Monkstown",1,"1"]],
   splitTitle:"New patients", split:[["Target areas","9","50%",1],["Elsewhere","9","50%",0]],
   tableCols:["Area","Patients","Share","Note"], table:[["Milltown","3","17%","Target"],["Dundrum","2","11%","Target"],["Blackrock","2","11%","Target"]],
   metrics:[["Local share","50%","","up","this week",[.5,.5,.5,.5,.5,.5,.5,.5,.5]],["Posts to approve","5","","up","library",[.5,.5,.5,.5,.5,.5,.5,.5,.5]],["Enquiries","30","","up","attributed",[.5,.5,.5,.5,.5,.5,.5,.5,.5]],["Campaign spend","€0","","up","draft",[0,0,0,0,0,0,0,0,0]]]}
];

const FILTER_GROUPS = [
  {title:"AREA", items:["Bookings","Finance","Marketing"]},
  {title:"TIME", items:["This week","Last week","October"]}
];

/* Legacy workflow model (the clinic Work page replaces its UI). */
const OPS_DEFS = [
  {id:"o1", name:"Enquiry to booking", kind:"automation", owner:"Inbox Assistant", ownerKind:"agent", initials:"IA",
   trigger:"New message", triggerKind:"event", next:"Event-based", last:"8 drafts ready", status:"approval", rate:100, on:true,
   what:"Drafts a reply with real open slots and waits for Deborah.", why:"Enquiries arrive while Deborah is treating patients.", saved:"0",
   steps:[["Trigger","New message"],["Draft","Reply in Deborah's voice"],["Approval","Deborah reviews","gate"],["Update","Marked sent in demo"]],
   runs:[["Today 07:20","4s","ok","8 drafts","€0.00"]]},
  {id:"o2", name:"Appointment preparation", kind:"routine", owner:"Patient Admin Agent", ownerKind:"agent", initials:"PA",
   trigger:"Daily, 07:10", triggerKind:"schedule", next:"Tomorrow", last:"4 checks open", status:"healthy", rate:100, on:true,
   what:"Checks forms and contact details before upcoming appointments.", why:"Missing paperwork slows the day down.", saved:"0",
   steps:[["Trigger","Daily at 07:10"],["Check","Forms and contact details"],["Update","Create admin tasks"]],
   runs:[["Today 07:10","3s","ok","4 checks","€0.00"]]},
  {id:"o3", name:"Payment reconciliation", kind:"automation", owner:"Finance Agent", ownerKind:"agent", initials:"FA",
   trigger:"Demo import", triggerKind:"event", next:"Event-based", last:"1 proposal", status:"approval", rate:100, on:true,
   what:"Suggests matches for received payments.", why:"Statement review took weeks at year end.", saved:"0",
   steps:[["Trigger","New receipts"],["Match","Reference and amount"],["Approval","Deborah approves","gate"],["Update","Allocation recorded"]],
   runs:[["Today 07:31","2s","ok","1 proposal","€0.00"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];


const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"", views:["All tasks"], filters:[]},
  {id:"approvals", label:"Approvals", blurb:"", views:["Awaiting you"], filters:[]},
  {id:"workflows", label:"Workflows", blurb:"", views:[], filters:[]},
  {id:"onboarding", label:"Onboarding", blurb:"", views:[], filters:[]}
];
const WORK_TASKS = [];
const WORKFLOWS = [];
const SCHEDULES = [];

const WIDGET_DEFS = [["inbox","Needs you"],["work","My work"],["activity","Activity"],["kpi","Today's numbers"],["visits","Today's appointments"]];
const WORK_WIDGETS = [
  {id:"queue", label:"Open tasks", value:"12", hint:"assigned to you or an agent", icon:"work", queue:"mine"}
];

const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted -
   the builder shows the whole catalogue, grouped, rather than a sample. */
/* Every context source and every tool an agent could be granted. */
const CONTEXT_DEFS = [
  ["Appointments","bookings","Calendar, slots and the waitlist"],
  ["Services","bookings","Illustrative catalogue and durations"],
  ["Patients","records","Contact details and form status (admin only)"],
  ["Conversations","inbox","Messages and drafts"],
  ["Receipts","money","Received funds and allocations"],
  ["Expenses","money","Recorded costs and receipt documents"],
  ["Content","marketing","Planner and library"],
  ["Tasks","work","Owners and due dates"],
  ["Activity log","system","Every event, agent and human"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read the calendar","read"],["Check form status","read"],
  ["Draft a reply","write"],["Draft an offer","write"],["Propose a payment match","write"],["Create task","write"],
  ["Send a message","external"],["Publish a post","external"]
];
const TRAIN_PHASES = [
  ["Reading the clinic records", "demo data"],
  ["Learning how Deborah words things", "warm, direct"],
  ["Checking the approval rules", "draft-first"],
  ["Writing its own system prompt", "draft"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like.",
   options:[["Bookings","Open slots and the waitlist"],["Inbox","Drafts waiting for review"],
            ["Money","Receipts to match"],["Preparation","Forms before appointments"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Clinic days 08:00","Tuesday, Thursday and Friday"],["Every morning 08:00","Including non-clinic days"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];

const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Pebble"],["executive-capsule","Executive"],["shield","Shield"],
  ["glass-visor","Visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only, deliberately desaturated so none of them reads as a
   state. Each is a pair: the deep shell for light themes and its pale partner
   for dark ones (the eyes take the other). The status light carries the state. */
const FACE_TINTS = [
  ["#191c1f","Graphite","#e3e6e8"],["#1b2430","Slate","#d3dde9"],["#241b2e","Aubergine","#ddd4ea"],
  ["#2a2118","Bronze","#eadccb"],["#16241f","Pine","#d1e4da"],["#2b1b1e","Oxblood","#eed5d7"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Patients",       "#4f9d8f", 0.00, 0.62, 58],
  ["Appointments",   "#7fb3d5", 0.90, 0.70, 52],
  ["Services",       "#c49a6c", 1.75, 0.66, 26],
  ["Conversations",  "#9b8ad8", 2.55, 0.72, 40],
  ["Receipts",       "#d98a8a", 3.35, 0.60, 38],
  ["Tasks",          "#d6b656", 4.15, 0.70, 34],
  ["Content",        "#6fbf73", 4.95, 0.64, 26],
  ["Agent runs",     "#5f7cf0", 5.65, 0.72, 30]
];


function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};