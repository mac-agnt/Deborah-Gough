/* The twelve modules and their top-bar tabs. Tab ids are stable: pages,
   deep links (store.go) and agent runs all use them. */

export interface TabDef { id: string; label: string }

export const MODULE_TABS: Record<string, TabDef[]> = {
  Bookings: [
    { id: "overview", label: "Overview" }, { id: "calendar", label: "Calendar" }, { id: "online", label: "Online booking" },
    { id: "waitlist", label: "Waitlist" }, { id: "capacity", label: "Capacity" },
  ],
  Patients: [{ id: "directory", label: "Directory" }, { id: "preparation", label: "Preparation" }, { id: "followups", label: "Follow-ups" }],
  Inbox: [{ id: "conversations", label: "Conversations" }, { id: "drafts", label: "Drafts" }, { id: "library", label: "Response library" }],
  Marketing: [
    { id: "overview", label: "Overview" }, { id: "planner", label: "Planner" }, { id: "library", label: "Content library" },
    { id: "local", label: "Local growth" }, { id: "performance", label: "Performance" },
  ],
  Finance: [{ id: "overview", label: "Overview" }, { id: "transactions", label: "Transactions" }, { id: "revenue", label: "Revenue & costs" }, { id: "accountant", label: "Accountant pack" }],
  Dashboard: [{ id: "clinic", label: "Clinic" }, { id: "journey", label: "Patient journey" }, { id: "growth", label: "Growth" }],
  Agents: [{ id: "overview", label: "Overview" }, { id: "runs", label: "Runs" }, { id: "controls", label: "Controls" }],
  Work: [{ id: "tasks", label: "Tasks" }, { id: "approvals", label: "Approvals" }, { id: "workflows", label: "Workflows" }, { id: "onboarding", label: "Onboarding" }],
  Activity: [{ id: "all", label: "Everything" }, { id: "imported", label: "Imported" }, { id: "agent", label: "Agent proposals" }, { id: "user", label: "Your actions" }],
  Settings: [
    { id: "org", label: "Organisation" }, { id: "people", label: "People & permissions" }, { id: "systems", label: "Systems" },
    { id: "governance", label: "Governance" }, { id: "ai", label: "AI controls" }, { id: "experience", label: "Experience" },
  ],
};

/** Pages rendered entirely by clinic components (all tabs). */
export const CLINIC_PAGES = ["Bookings", "Patients", "Inbox", "Marketing", "Finance", "Dashboard", "Work", "Activity", "Settings"];

export function defaultTab(page: string): string | undefined {
  return MODULE_TABS[page]?.[0]?.id;
}
