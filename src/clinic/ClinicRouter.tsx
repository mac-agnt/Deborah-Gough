/* Renders the clinic module for the active page and tab. The shell keeps
   Home (chat), Agents → Overview and Records → Ontology / Documents. */

import Bookings from "./pages/Bookings";
import Patients from "./pages/Patients";
import Inbox from "./pages/Inbox";
import Marketing from "./pages/Marketing";
import Finance from "./pages/Finance";
import Dashboard from "./pages/Dashboard";
import Work from "./pages/Work";
import AgentsClinic from "./pages/AgentsClinic";
import ActivityClinic from "./pages/ActivityClinic";
import SettingsClinic from "./pages/SettingsClinic";
import Registry from "./pages/Registry";

export default function ClinicRouter({ v }: { v: any }) {
  const page: string = v.clinic?.page;
  const tab: string = v.clinic?.tab;
  // Keyed by page so each module mounts fresh and can read its deep-link focus.
  switch (page) {
    case "Bookings": return <Bookings key={page} tab={tab} v={v} />;
    case "Patients": return <Patients key={page} tab={tab} v={v} />;
    case "Inbox": return <Inbox key={page} tab={tab} v={v} />;
    case "Marketing": return <Marketing key={page} tab={tab} v={v} />;
    case "Finance": return <Finance key={page} tab={tab} v={v} />;
    case "Dashboard": return <Dashboard key={page} tab={tab} v={v} />;
    case "Work": return <Work key={page} tab={tab} v={v} />;
    case "Agents": return <AgentsClinic key={page} tab={tab} v={v} />;
    case "Activity": return <ActivityClinic key={page} tab={tab} v={v} />;
    case "Settings": return <SettingsClinic key={page} tab={tab} v={v} />;
    case "Records": return <Registry key={page} v={v} />;
    default: return null;
  }
}
