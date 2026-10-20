import { auditSectionHref, type AuditSection } from "./audit/audit-navigation";
import { i18n } from "@/i18n";

export type AgentDetailView =
  | "overview"
  | "instructions"
  | "skills"
  | "runtime"
  | "secrets"
  | "tools"
  | "channels"
  | "permissions"
  | "api-keys"
  | "revisions"
  | "run-detail";

export type AgentLocalDetailView = Exclude<AgentDetailView, "run-detail">;

export const AGENT_DETAIL_NAVIGATION: ReadonlyArray<{
  label: string;
  items: ReadonlyArray<{ value: AgentLocalDetailView; label: string }>;
}> = [
  {
    get label() {
    return i18n.t("agents.agentDetailNavigation.agent");
  },
    items: [
      { value: "overview", get label() {
    return i18n.t("agents.agentDetailNavigation.overview");
  } },
      { value: "instructions", get label() {
    return i18n.t("agents.agentDetailNavigation.instructions");
  } },
      { value: "skills", get label() {
    return i18n.t("agents.agentDetailNavigation.skills");
  } },
    ],
  },
  {
    get label() {
    return i18n.t("agents.agentDetailNavigation.runtime");
  },
    items: [
      { value: "runtime", get label() {
    return i18n.t("agents.agentDetailNavigation.harnessRuntime");
  } },
      { value: "secrets", get label() {
    return i18n.t("agents.agentDetailNavigation.secrets");
  } },
      { value: "tools", get label() {
    return i18n.t("agents.agentDetailNavigation.tools");
  } },
      { value: "channels", get label() {
    return i18n.t("agents.agentDetailNavigation.channels");
  } },
    ],
  },
  {
    get label() {
    return i18n.t("agents.agentDetailNavigation.governance");
  },
    items: [
      { value: "permissions", get label() {
    return i18n.t("agents.agentDetailNavigation.permissionsTrust");
  } },
      { value: "api-keys", get label() {
    return i18n.t("agents.agentDetailNavigation.aPIKeys");
  } },
      { value: "revisions", get label() {
    return i18n.t("agents.agentDetailNavigation.revisions");
  } },
    ],
  },
] as const;

export function parseAgentDetailView(value: string | null): AgentLocalDetailView {
  if (value === "instructions" || value === "prompts") return "instructions";
  if (value === "skills") return "skills";
  if (value === "runtime" || value === "configure" || value === "configuration") return "runtime";
  if (value === "secrets") return "secrets";
  if (value === "tools") return "tools";
  if (value === "channels") return "channels";
  if (value === "permissions" || value === "trust") return "permissions";
  if (value === "api-keys" || value === "keys") return "api-keys";
  if (value === "revisions" || value === "history") return "revisions";
  return "overview";
}

export function agentDetailHref(agentRef: string, view: AgentLocalDetailView = "overview") {
  return `/agents/${agentRef}/${view}`;
}

export function agentLegacyAuditSection(value: string | null): AuditSection | null {
  if (value === "runs") return "runs";
  if (value === "audit" || value === "activity") return "activity";
  if (value === "cost" || value === "costs") return "costs";
  if (value === "budget" || value === "budgets") return "budgets";
  return null;
}

export function agentScopedAuditHref(agentId: string, section: AuditSection) {
  return auditSectionHref(section, {
    mode: section === "activity" ? "agents" : undefined,
    agentId,
  });
}
