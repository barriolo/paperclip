import type { IssueChangeReceiptEntry } from "@paperclipai/shared";
import { formatReviewPolicyValue } from "./review-policy";
import { i18n } from "@/i18n";

/**
 * Read + format the field-level change receipts carried on an `issue.updated`
 * activity event (the open cross-task write design (audit), built on the field-change receipts the API already records).
 *
 * Every issue PATCH — agent and board alike — must leave an auditable record of
 * who changed what, when, and under which authorization. The server writes that
 * receipt; this module turns it into something a human can scan in the activity
 * stream without opening the audit log.
 *
 * The server already drops `updatedAt` and truncates long text (flagging it with
 * `updated: true`), so this module renders what it is given rather than
 * re-deciding what is interesting.
 */

/** Field names whose raw ids carry no meaning in a scannable summary. */
const FIELD_LABELS: Record<string, string> = {
  get assigneeAgentId() {
    return i18n.t("issues.issueChangeReceipt.assignee");
  },
  get assigneeUserId() {
    return i18n.t("issues.issueChangeReceipt.assigneeUser");
  },
  get responsibleUserId() {
    return i18n.t("issues.issueChangeReceipt.responsibleUser");
  },
  get blockedByIssueIds() {
    return i18n.t("issues.issueChangeReceipt.blockers");
  },
  get labelIds() {
    return i18n.t("issues.issueChangeReceipt.labels");
  },
  get parentId() {
    return i18n.t("issues.issueChangeReceipt.parent");
  },
  get projectId() {
    return i18n.t("issues.issueChangeReceipt.project");
  },
  get goalId() {
    return i18n.t("issues.issueChangeReceipt.goal");
  },
  get workMode() {
    return i18n.t("issues.issueChangeReceipt.workMode");
  },
  get reviewPolicy() {
    return i18n.t("issues.issueChangeReceipt.whoCanApprove");
  },
  get billingCode() {
    return i18n.t("issues.issueChangeReceipt.billingCode");
  },
  get checkoutRunId() {
    return i18n.t("issues.issueChangeReceipt.checkoutRun");
  },
  get executionRunId() {
    return i18n.t("issues.issueChangeReceipt.executionRun");
  },
  get hiddenAt() {
    return i18n.t("issues.issueChangeReceipt.hidden");
  },
  get startedAt() {
    return i18n.t("issues.issueChangeReceipt.started");
  },
  get completedAt() {
    return i18n.t("issues.issueChangeReceipt.completed");
  },
  get cancelledAt() {
    return i18n.t("issues.issueChangeReceipt.cancelled");
  },
  get requestDepth() {
    return i18n.t("issues.issueChangeReceipt.requestDepth");
  },
  get sourceTrust() {
    return i18n.t("issues.issueChangeReceipt.sourceTrust");
  },
  get executionPolicy() {
    return i18n.t("issues.issueChangeReceipt.executionPolicy");
  },
  get executionWorkspaceId() {
    return i18n.t("issues.issueChangeReceipt.executionWorkspace");
  },
  get projectWorkspaceId() {
    return i18n.t("issues.issueChangeReceipt.projectWorkspace");
  },
};

/** Human label for a changed field, e.g. `assigneeAgentId` → "Assignee". */
export function issueChangeFieldLabel(field: string): string {
  const known = FIELD_LABELS[field];
  if (known) return known;
  // camelCase / snake_case → "Sentence case".
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const VALUE_PREVIEW_BUDGET = 72;

/**
 * Render one side of a change for display. Never returns an empty string, so a
 * receipt row always reads as "from → to" rather than trailing into nothing.
 */
export function formatIssueChangeValue(
  value: unknown,
  options: { resolveAgentLabel?: (id: string) => string | null | undefined;
    resolveUserLabel?: (id: string) => string | null | undefined;
    field?: string } = {},
): string {
  // `reviewPolicy` is nullable-by-default: a cleared column means "anyone can
  // approve", not "no value" (PAP-16506), so it resolves before the null branch.
  if (options.field === "reviewPolicy") return formatReviewPolicyValue(value);
  if (value === null || value === undefined || value === "") return "none";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "none";
    const strings = value.filter((entry): entry is string => typeof entry === "string");
    if (strings.length !== value.length) return `${value.length} items`;
    return strings.length <= 3
      ? strings.map((id) => shortenId(id)).join(", ")
      : `${strings.length} items`;
  }

  if (value instanceof Date) return value.toLocaleString();

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "none";
    // Ids resolve to names when the directory is loaded; otherwise they shorten.
    const resolved = options.field?.toLowerCase().includes("agent")
      ? options.resolveAgentLabel?.(trimmed)
      : options.field?.toLowerCase().includes("user")
        ? options.resolveUserLabel?.(trimmed)
        : null;
    if (resolved) return resolved;
    if (isIsoTimestamp(trimmed)) return new Date(trimmed).toLocaleString();
    if (looksLikeId(trimmed)) return shortenId(trimmed);
    const humanized = trimmed.includes(" ") ? trimmed : trimmed.replace(/_/g, " ");
    return truncate(humanized);
  }

  // Objects (execution policy, workspace settings) are structural — the receipt
  // records that they moved, and the audit log holds the full value.
  return "updated";
}

function truncate(value: string): string {
  const chars = Array.from(value);
  if (chars.length <= VALUE_PREVIEW_BUDGET) return value;
  return `${chars.slice(0, VALUE_PREVIEW_BUDGET).join("")}…`;
}

function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

function looksLikeId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function shortenId(value: string): string {
  return looksLikeId(value) ? value.slice(0, 8) : truncate(value);
}

export interface IssueChangeReceiptRow {
  field: string;
  label: string;
  from: string;
  to: string;
  /** Server flagged the values as truncated previews of long text. */
  truncated: boolean;
}

function isChangeEntry(value: unknown): value is IssueChangeReceiptEntry {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && "from" in (value as object) && "to" in (value as object);
}

/**
 * Parse `details.changes` off an activity event into display rows. Returns an
 * empty array for events with no receipt (older rows, non-PATCH actions), so
 * callers can render nothing without special-casing.
 */
export function readIssueChangeReceipt(
  details: Record<string, unknown> | null | undefined,
  options: Parameters<typeof formatIssueChangeValue>[1] = {},
): IssueChangeReceiptRow[] {
  const changes = details?.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return [];

  const rows: IssueChangeReceiptRow[] = [];
  for (const [field, entry] of Object.entries(changes as Record<string, unknown>)) {
    if (!isChangeEntry(entry)) continue;
    rows.push({
      field,
      label: issueChangeFieldLabel(field),
      from: formatIssueChangeValue(entry.from, { ...options, field }),
      to: formatIssueChangeValue(entry.to, { ...options, field }),
      truncated: entry.updated === true,
    });
  }
  // Stable, scannable order regardless of JSON key order (jsonb reorders keys).
  return rows.sort((a, b) => a.label.localeCompare(b.label));
}

/** Authorization reasons, as recorded by the server's write-policy decision. */
const AUTHORIZATION_REASON_LABELS: Record<string, string> = {
  get allow_visible_issue_write() {
    return i18n.t("issues.issueChangeReceipt.defaultopenWriteOnAVisible");
  },
  get allow_scoped_agent_write() {
    return i18n.t("issues.issueChangeReceipt.scopedAgentWrite");
  },
  get allow_board_actor() {
    return i18n.t("issues.issueChangeReceipt.boardActor");
  },
  get allow_self() {
    return i18n.t("issues.issueChangeReceipt.ownTask");
  },
  get allow_issue_mention_grant() {
    return i18n.t("issues.issueChangeReceipt.mentionGrant");
  },
  get allow_direct_parent_report() {
    return i18n.t("issues.issueChangeReceipt.directParentReport");
  },
  get allow_low_trust_boundary() {
    return i18n.t("issues.issueChangeReceipt.lowtrustBoundaryAllowance");
  },
  get allow_explicit_grant() {
    return i18n.t("issues.issueChangeReceipt.explicitPermissionGrant");
  },
  get allow_instance_admin() {
    return i18n.t("issues.issueChangeReceipt.instanceAdmin");
  },
  get allow_local_board() {
    return i18n.t("issues.issueChangeReceipt.localBoard");
  },
  get internal_agent_write() {
    return i18n.t("issues.issueChangeReceipt.internalAgentWrite");
  },
};

/**
 * Human phrasing for the authorization reason on a write receipt. Unknown
 * reasons degrade to their humanized code rather than disappearing — an
 * unexplained write is worse than an ugly one.
 */
export function issueAuthorizationReasonLabel(reason: string | null | undefined): string | null {
  const trimmed = reason?.trim();
  if (!trimmed) return null;
  return AUTHORIZATION_REASON_LABELS[trimmed] ?? trimmed.replace(/_/g, " ");
}
