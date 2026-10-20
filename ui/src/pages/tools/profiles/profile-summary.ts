import type { ToolProfileStatus, ToolProfileSummary, ToolProfileWithDetails } from "@paperclipai/shared";
import { i18n } from "@/i18n";

/**
 * Prosumer copy for the access-profile index (PAP-10997, AP1). Reads the
 * server-computed `summary` and renders the friendly "Allows" / "Assigned to"
 * lines the table shows. Vocabulary gate: nothing here says
 * binding/entry/selector/priority — only "tools", "apps", "agents".
 */

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "9 tools · 3 apps" / "All tools" / "All except 2 tools". */
export function allowsLabel(summary: ToolProfileSummary): string {
  if (summary.accessMode === "all_except") {
    return summary.excludedToolCount === 0
      ? i18n.t("settings.profileSummary.allTools")
      : `All except ${plural(summary.excludedToolCount, "tool")}`;
  }
  const parts = [plural(summary.allowedToolCount, "tool")];
  if (summary.allowedApplicationCount > 0) {
    parts.push(plural(summary.allowedApplicationCount, "app"));
  }
  return parts.join(" · ");
}

export interface AssignedLabel {
  text: string;
  /** A profile with no assignment has no effect — the index shows a quiet hint. */
  unassigned: boolean;
}

/** "Organization default" / "2 agents" / "Not assigned yet". */
export function assignedLabel(summary: ToolProfileSummary): AssignedLabel {
  if (summary.isCompanyDefault) return { text: "Organization default", unassigned: false };
  if (summary.appliesToAgentCount > 0) {
    return { text: plural(summary.appliesToAgentCount, "agent"), unassigned: false };
  }
  if (summary.assignmentCount > 0) {
    return { text: plural(summary.assignmentCount, "assignment"), unassigned: false };
  }
  return { text: "Not assigned yet", unassigned: true };
}

export const STATUS_LABEL: Record<ToolProfileStatus, string> = {
  get draft() {
    return i18n.t("settings.profileSummary.draft");
  },
  get active() {
    return i18n.t("settings.profileSummary.active");
  },
  get disabled() {
    return i18n.t("settings.profileSummary.off");
  },
  get archived() {
    return i18n.t("settings.profileSummary.archived");
  },
};

export function isDraft(profile: Pick<ToolProfileWithDetails, "status">): boolean {
  return profile.status === "draft";
}
