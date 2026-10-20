import type { Agent } from "@paperclipai/shared";
import type { CompanyUserProfile } from "./company-members";
import { formatReviewPolicyValue } from "./review-policy";
import { i18n } from "@/i18n";

type ActivityDetails = Record<string, unknown> | null | undefined;

type ActivityParticipant = {
  type: "agent" | "user";
  agentId?: string | null;
  userId?: string | null;
};

type ActivityIssueReference = {
  id?: string | null;
  identifier?: string | null;
  title?: string | null;
};

interface ActivityFormatOptions {
  agentMap?: Map<string, Agent>;
  userProfileMap?: Map<string, CompanyUserProfile>;
  currentUserId?: string | null;
}

const ACTIVITY_ROW_VERBS: Record<string, string> = {
  "issue.created": "created",
  "issue.updated": "updated",
  "issue.read_marked": "read",
  "issue.read_unmarked": "marked unread",
  "issue.checked_out": "checked out",
  "issue.released": "released",
  "issue.comment_added": "commented on",
  "issue.comment_cancelled": "cancelled a queued comment on",
  "issue.queued_comment_edited": "edited a queued comment on",
  "issue.queued_comments_reordered": "reordered queued comments on",
  "issue.queued_comment_discarded": "discarded a queued comment on",
  "issue.comment_deleted": "deleted a comment on",
  "issue.attachment_added": "attached file to",
  "issue.attachment_removed": "removed attachment from",
  "issue.document_created": "created document for",
  "issue.document_updated": "updated document on",
  "issue.document_locked": "locked document on",
  "issue.document_unlocked": "unlocked document on",
  "issue.document_deleted": "deleted document from",
  "issue.monitor_scheduled": "scheduled monitor on",
  "issue.monitor_triggered": "triggered monitor for",
  "issue.monitor_cleared": "cleared monitor on",
  "issue.monitor_skipped": "skipped monitor for",
  "issue.monitor_exhausted": "exhausted monitor on",
  "issue.monitor_recovery_wake_queued": "queued monitor recovery for",
  "issue.monitor_recovery_issue_created": "created monitor recovery for",
  "issue.monitor_escalated_to_board": "escalated monitor for",
  "issue.commented": "commented on",
  "issue.deleted": "deleted",
  "issue.successful_run_handoff_required": "flagged missing next step on",
  "issue.successful_run_handoff_resolved": "recorded next step chosen on",
  "issue.successful_run_handoff_escalated": "escalated missing next step on",
  "issue.accepted_plan_decomposition_updated": "updated accepted-plan decomposition on",
  "issue.recovery_action_opened": "opened a recovery action on",
  "issue.recovery_action_resolved": "resolved the recovery action on",
  "issue.recovery_action_escalated": "escalated the recovery action on",
  "agent.created": "created",
  "agent.updated": "updated",
  "agent.paused": "paused",
  "agent.resumed": "resumed",
  "agent.error_cleared": "cleared error on",
  "agent.terminated": "terminated",
  "agent.key_created": "created API key for",
  "agent.budget_updated": "updated budget for",
  "agent.runtime_session_reset": "reset session for",
  "heartbeat.invoked": "invoked heartbeat for",
  "heartbeat.cancelled": "cancelled heartbeat for",
  "heartbeat.output_stale_source_resolved": "system-folded stale run on",
  "heartbeat.output_stale_recovery_recursion_refused": "refused recovery-on-recovery for",
  "approval.created": "requested approval",
  "approval.approved": "approved",
  "approval.rejected": "rejected",
  // Interaction outcomes (PAP-16506). An agent may now resolve one — including a
  // review of its own work — so these must read as outcomes in the feed instead
  // of falling through to the raw "issue thread interaction accepted" action id.
  // `details.interactionKind` sharpens the wording; see INTERACTION_OUTCOME_LABELS.
  "issue.thread_interaction_created": "asked for a decision on",
  "issue.thread_interaction_accepted": "accepted the request on",
  "issue.thread_interaction_rejected": "rejected the request on",
  "issue.thread_interaction_answered": "answered the request on",
  "issue.thread_interaction_withdrawn": "withdrew the request on",
  "issue.thread_interaction_cancelled": "cancelled the request on",
  "issue.thread_interaction_skipped": "skipped the request on",
  "issue.thread_interaction_expired": "expired the request on",
  "issue.thread_interaction_item_verdicts_submitted": "submitted verdicts on",
  "issue.stalled_review_decided": "recorded a review verdict on",
  "project.created": "created",
  "project.updated": "updated",
  "project.deleted": "deleted",
  "goal.created": "created",
  "goal.updated": "updated",
  "goal.deleted": "deleted",
  "cost.reported": "reported cost for",
  "cost.recorded": "recorded cost for",
  "company.created": "created organization",
  "company.updated": "updated organization",
  "company.archived": "archived",
  "company.reactivated": "reactivated",
  "company.budget_updated": "updated budget for",
  "audit.exported": "exported the agent audit log for",
  "tool_app.connected": "connected",
  "tool_app.oauth_connected": "connected credentials for",
  "tool_app.oauth_failed": "failed to connect credentials for",
  "tool_app.oauth_access_finalized": "finished credential access for",
  "tool_app.finished": "finished setup for",
  "tool_app.reconnected": "reconnected",
  "tool_connection.created": "created",
  "tool_connection.updated": "updated",
  "tool_connection.archived": "removed",
  "tool_connection.catalog_refresh": "refreshed actions for",
  "tool_connection.installs_synced": "changed agent installs for",
  "tool_connection.install_access_extended": "extended agent access for",
  "tool_connection.grant_audience_replaced": "changed human access for",
  "tool_connection.grant_added": "added credentials to",
  "tool_connection.grant_revoked": "revoked credentials from",
  "tool_connection.grant_delegated": "delegated credentials for",
  "tool_connection.grant_delegation_revoked": "revoked credential delegation for",
};

const ISSUE_ACTIVITY_LABELS: Record<string, string> = {
  get "issue.created"() {
    return i18n.t("rest.activityFormat.createdTheIssue");
  },
  get "issue.updated"() {
    return i18n.t("rest.activityFormat.updatedTheIssue");
  },
  get "issue.checked_out"() {
    return i18n.t("rest.activityFormat.checkedOutTheIssue");
  },
  get "issue.released"() {
    return i18n.t("rest.activityFormat.releasedTheIssue");
  },
  get "issue.comment_added"() {
    return i18n.t("rest.activityFormat.addedAComment");
  },
  get "issue.comment_cancelled"() {
    return i18n.t("rest.activityFormat.cancelledAQueuedComment");
  },
  get "issue.queued_comment_edited"() {
    return i18n.t("rest.activityFormat.editedAQueuedComment");
  },
  get "issue.queued_comments_reordered"() {
    return i18n.t("rest.activityFormat.reorderedQueuedComments");
  },
  get "issue.queued_comment_discarded"() {
    return i18n.t("rest.activityFormat.discardedAQueuedComment");
  },
  get "issue.comment_deleted"() {
    return i18n.t("rest.activityFormat.deletedAComment");
  },
  get "issue.feedback_vote_saved"() {
    return i18n.t("rest.activityFormat.savedFeedbackOnAnAi");
  },
  get "issue.attachment_added"() {
    return i18n.t("rest.activityFormat.addedAnAttachment");
  },
  get "issue.attachment_removed"() {
    return i18n.t("rest.activityFormat.removedAnAttachment");
  },
  get "issue.document_created"() {
    return i18n.t("rest.activityFormat.createdADocument");
  },
  get "issue.document_updated"() {
    return i18n.t("rest.activityFormat.updatedADocument");
  },
  get "issue.document_locked"() {
    return i18n.t("rest.activityFormat.lockedADocument");
  },
  get "issue.document_unlocked"() {
    return i18n.t("rest.activityFormat.unlockedADocument");
  },
  get "issue.document_deleted"() {
    return i18n.t("rest.activityFormat.deletedADocument");
  },
  get "issue.monitor_scheduled"() {
    return i18n.t("rest.activityFormat.scheduledAMonitor");
  },
  get "issue.monitor_triggered"() {
    return i18n.t("rest.activityFormat.triggeredAMonitor");
  },
  get "issue.monitor_cleared"() {
    return i18n.t("rest.activityFormat.clearedAMonitor");
  },
  get "issue.monitor_skipped"() {
    return i18n.t("rest.activityFormat.skippedAMonitor");
  },
  get "issue.monitor_exhausted"() {
    return i18n.t("rest.activityFormat.exhaustedAMonitor");
  },
  get "issue.monitor_recovery_wake_queued"() {
    return i18n.t("rest.activityFormat.queuedAMonitorRecoveryWake");
  },
  get "issue.monitor_recovery_issue_created"() {
    return i18n.t("rest.activityFormat.createdAMonitorRecoveryIssue");
  },
  get "issue.monitor_escalated_to_board"() {
    return i18n.t("rest.activityFormat.escalatedAMonitorToThe");
  },
  get "issue.deleted"() {
    return i18n.t("rest.activityFormat.deletedTheIssue");
  },
  get "issue.successful_run_handoff_required"() {
    return i18n.t("rest.activityFormat.runFinishedWithoutAClear");
  },
  get "issue.successful_run_handoff_resolved"() {
    return i18n.t("rest.activityFormat.nextStepChosen");
  },
  get "issue.successful_run_handoff_escalated"() {
    return i18n.t("rest.activityFormat.runFinishedWithoutANext");
  },
  get "issue.cross_issue_influence_cap_rejected"() {
    return i18n.t("rest.activityFormat.hitThePerrunCrosstaskWrite");
  },
  get "issue.cross_issue_influence_observed"() {
    return i18n.t("rest.activityFormat.madeACrosstaskWrite");
  },
  get "issue.attribution_spoof_rejected"() {
    return i18n.t("rest.activityFormat.triedToChooseItsOwn");
  },
  get "issue.recovery_action_opened"() {
    return i18n.t("rest.activityFormat.openedASourcescopedRecoveryAction");
  },
  get "issue.recovery_action_resolved"() {
    return i18n.t("rest.activityFormat.resolvedTheRecoveryAction");
  },
  get "issue.recovery_action_escalated"() {
    return i18n.t("rest.activityFormat.escalatedTheRecoveryAction");
  },
  get "issue.accepted_plan_decomposition_updated"() {
    return i18n.t("rest.activityFormat.updatedTheAcceptedplanDecomposition");
  },
  get "agent.created"() {
    return i18n.t("rest.activityFormat.createdAnAgent");
  },
  get "agent.updated"() {
    return i18n.t("rest.activityFormat.updatedTheAgent");
  },
  get "agent.paused"() {
    return i18n.t("rest.activityFormat.pausedTheAgent");
  },
  get "agent.resumed"() {
    return i18n.t("rest.activityFormat.resumedTheAgent");
  },
  get "agent.error_cleared"() {
    return i18n.t("rest.activityFormat.clearedTheAgentError");
  },
  get "agent.terminated"() {
    return i18n.t("rest.activityFormat.terminatedTheAgent");
  },
  get "heartbeat.invoked"() {
    return i18n.t("rest.activityFormat.invokedAHeartbeat");
  },
  get "heartbeat.cancelled"() {
    return i18n.t("rest.activityFormat.cancelledAHeartbeat");
  },
  get "heartbeat.output_stale_source_resolved"() {
    return i18n.t("rest.activityFormat.systemFoldedAStaleRun");
  },
  get "heartbeat.output_stale_recovery_recursion_refused"() {
    return i18n.t("rest.activityFormat.refusedRecoveryonrecoveryEscalation");
  },
  get "approval.created"() {
    return i18n.t("rest.activityFormat.requestedApproval");
  },
  "approval.approved": "approved",
  "approval.rejected": "rejected",
  get "issue.thread_interaction_created"() {
    return i18n.t("rest.activityFormat.askedForADecision");
  },
  get "issue.thread_interaction_accepted"() {
    return i18n.t("rest.activityFormat.acceptedTheRequest");
  },
  get "issue.thread_interaction_rejected"() {
    return i18n.t("rest.activityFormat.rejectedTheRequest");
  },
  get "issue.thread_interaction_answered"() {
    return i18n.t("rest.activityFormat.answeredTheRequest");
  },
  get "issue.thread_interaction_withdrawn"() {
    return i18n.t("rest.activityFormat.withdrewTheRequest");
  },
  get "issue.thread_interaction_cancelled"() {
    return i18n.t("rest.activityFormat.cancelledTheRequest");
  },
  get "issue.thread_interaction_skipped"() {
    return i18n.t("rest.activityFormat.skippedTheRequest");
  },
  get "issue.thread_interaction_expired"() {
    return i18n.t("rest.activityFormat.expiredTheRequest");
  },
  get "issue.thread_interaction_item_verdicts_submitted"() {
    return i18n.t("rest.activityFormat.submittedVerdictsOnTheRequest");
  },
  get "issue.stalled_review_decided"() {
    return i18n.t("rest.activityFormat.recordedAReviewVerdict");
  },
};

/**
 * `issue.stalled_review_decided` carries the verb the actor chose, so the line
 * names the verdict ("approved the review") rather than the generic action.
 * Mirrors `StalledReviewDecisionAction` in shared.
 */
const STALLED_REVIEW_DECISION_LABELS: Record<string, string> = {
  get approve() {
    return i18n.t("rest.activityFormat.approvedTheReview");
  },
  get request_changes() {
    return i18n.t("rest.activityFormat.requestedChangesOnTheReview");
  },
  get send_back() {
    return i18n.t("rest.activityFormat.sentTheReviewBackTo");
  },
};

/**
 * `issue.thread_interaction_accepted` / `_rejected` fire for *every* interaction
 * kind, not only for a review. A task suggestion or a question is accepted, not
 * approved, so the kind on the event picks the verb. Kinds absent from a map
 * keep the neutral "accepted the request" wording from the tables above, which
 * is also the fallback for an event that carries no kind.
 */
const INTERACTION_ACCEPTED_LABELS: Record<string, string> = {
  get request_confirmation() {
    return i18n.t("rest.activityFormat.approvedTheRequest");
  },
  get request_checkbox_confirmation() {
    return i18n.t("rest.activityFormat.approvedTheRequest");
  },
  get suggest_tasks() {
    return i18n.t("rest.activityFormat.acceptedTheTaskSuggestions");
  },
  get ask_user_questions() {
    return i18n.t("rest.activityFormat.acceptedTheAnswers");
  },
};

const INTERACTION_REJECTED_LABELS: Record<string, string> = {
  get request_confirmation() {
    return i18n.t("rest.activityFormat.rejectedTheRequest");
  },
  get request_checkbox_confirmation() {
    return i18n.t("rest.activityFormat.rejectedTheRequest");
  },
  get suggest_tasks() {
    return i18n.t("rest.activityFormat.declinedTheTaskSuggestions");
  },
  get ask_user_questions() {
    return i18n.t("rest.activityFormat.declinedTheQuestions");
  },
};

/**
 * Kind-aware wording for an interaction outcome, or `null` when the tables
 * above already say it well enough.
 */
function formatInteractionOutcomeLabel(action: string, details: ActivityDetails): string | null {
  const table = action === "issue.thread_interaction_accepted"
    ? INTERACTION_ACCEPTED_LABELS
    : action === "issue.thread_interaction_rejected"
      ? INTERACTION_REJECTED_LABELS
      : null;
  if (!table) return null;
  const kind = typeof details?.interactionKind === "string" ? details.interactionKind : null;
  return kind ? table[kind] ?? null : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function humanizeValue(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "none");
  return value.replace(/_/g, " ");
}

function isActivityParticipant(value: unknown): value is ActivityParticipant {
  const record = asRecord(value);
  if (!record) return false;
  return record.type === "agent" || record.type === "user";
}

function isActivityIssueReference(value: unknown): value is ActivityIssueReference {
  return asRecord(value) !== null;
}

function readParticipants(details: ActivityDetails, key: string): ActivityParticipant[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityParticipant);
}

function readIssueReferences(details: ActivityDetails, key: string): ActivityIssueReference[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityIssueReference);
}

function formatUserLabel(userId: string | null | undefined, options: ActivityFormatOptions = {}): string {
  if (!userId || userId === "local-board") return i18n.t("rest.activityFormat.board");
  if (options.currentUserId && userId === options.currentUserId) return i18n.t("rest.activityFormat.you");
  const profile = options.userProfileMap?.get(userId);
  if (profile) return profile.label;
  return `user ${userId.slice(0, 5)}`;
}

function formatParticipantLabel(participant: ActivityParticipant, options: ActivityFormatOptions): string {
  if (participant.type === "agent") {
    const agentId = participant.agentId ?? "";
    return options.agentMap?.get(agentId)?.name ?? "agent";
  }
  return formatUserLabel(participant.userId, options);
}

function formatIssueReferenceLabel(reference: ActivityIssueReference): string {
  if (reference.identifier) return reference.identifier;
  if (reference.title) return reference.title;
  if (reference.id) return reference.id.slice(0, 8);
  return "task";
}

function formatChangedEntityLabel(
  singular: string,
  plural: string,
  labels: string[],
): string {
  if (labels.length <= 0) return plural;
  if (labels.length === 1) return `${singular} ${labels[0]}`;
  return `${labels.length} ${plural}`;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readStringArrayLength(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.filter((entry) => typeof entry === "string" && entry.length > 0).length;
}

function formatAcceptedPlanDecompositionDetail(details: ActivityDetails): string | null {
  if (!details) return null;
  const status = typeof details.status === "string" ? details.status : null;
  const requested = readNumber(details.requestedChildCount);
  const totalChildren = readStringArrayLength(details.childIssueIds);
  const newlyCreated = readStringArrayLength(details.newlyCreatedChildIssueIds);
  const reused = Math.max(0, totalChildren - newlyCreated);
  const parts: string[] = [];
  if (newlyCreated > 0) parts.push(`created ${newlyCreated} new`);
  if (reused > 0) parts.push(`reused ${reused} existing`);
  if (parts.length === 0 && requested !== null) parts.push(`${requested} requested`);
  const summary = parts.length > 0 ? parts.join(", ") : null;
  if (status === "completed" && summary) return `decomposition completed (${summary})`;
  if (status === "completed") return "decomposition completed";
  if (status === "in_flight" && summary) return `decomposition in flight (${summary})`;
  return summary;
}

function formatIssueUpdatedVerb(details: ActivityDetails): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  if (details.status !== undefined) {
    const from = previous.status;
    const to = humanizeValue(details.status === "in_review" && details.externalConversationState === "waiting" ? "idle" : details.status);
    return from
      ? `changed status from ${humanizeValue(from)} to ${to} on`
      : `changed status to ${to} on`;
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    return from
      ? `changed priority from ${humanizeValue(from)} to ${humanizeValue(details.priority)} on`
      : `changed priority to ${humanizeValue(details.priority)} on`;
  }
  return null;
}

function formatAssigneeName(details: ActivityDetails, options: ActivityFormatOptions): string | null {
  if (!details) return null;
  const agentId = details.assigneeAgentId;
  const userId = details.assigneeUserId;
  if (typeof agentId === "string" && agentId) {
    return options.agentMap?.get(agentId)?.name ?? "agent";
  }
  if (typeof userId === "string" && userId) {
    return formatUserLabel(userId, options);
  }
  return null;
}

function formatIssueUpdatedAction(details: ActivityDetails, options: ActivityFormatOptions = {}): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  const parts: string[] = [];

  if (details.status !== undefined) {
    const from = previous.status;
    const to = humanizeValue(details.status === "in_review" && details.externalConversationState === "waiting" ? "idle" : details.status);
    parts.push(
      from
        ? `changed the status from ${humanizeValue(from)} to ${to}`
        : `changed the status to ${to}`,
    );
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    parts.push(
      from
        ? `changed the priority from ${humanizeValue(from)} to ${humanizeValue(details.priority)}`
        : `changed the priority to ${humanizeValue(details.priority)}`,
    );
  }
  if (details.assigneeAgentId !== undefined || details.assigneeUserId !== undefined) {
    const assigneeName = formatAssigneeName(details, options);
    parts.push(assigneeName ? `made ${assigneeName} responsible for the task` : "cleared the responsible");
  }
  if (details.reviewPolicy !== undefined) {
    // `null` is the default ("anyone can approve"), so it must not read as
    // "changed the review policy to none" (PAP-16506).
    parts.push(`changed who can approve to ${formatReviewPolicyValue(details.reviewPolicy)}`);
  }
  if (details.title !== undefined) parts.push("updated the title");
  if (details.description !== undefined) parts.push("updated the description");

  return parts.length > 0 ? parts.join(", ") : null;
}

function formatStructuredIssueChange(input: {
  action: string;
  details: ActivityDetails;
  options: ActivityFormatOptions;
  forIssueDetail: boolean;
}): string | null {
  const details = input.details;
  if (!details) return null;

  if (input.action === "issue.blockers_updated") {
    const added = readIssueReferences(details, "addedBlockedByIssues").map(formatIssueReferenceLabel);
    const removed = readIssueReferences(details, "removedBlockedByIssues").map(formatIssueReferenceLabel);
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel("blocker", "blockers", added);
      return input.forIssueDetail ? `added ${changed}` : `added ${changed} to`;
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel("blocker", "blockers", removed);
      return input.forIssueDetail ? `removed ${changed}` : `removed ${changed} from`;
    }
    return input.forIssueDetail ? "updated blockers" : "updated blockers on";
  }

  if (input.action === "issue.reviewers_updated" || input.action === "issue.approvers_updated") {
    const added = readParticipants(details, "addedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const removed = readParticipants(details, "removedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const singular = input.action === "issue.reviewers_updated" ? "reviewer" : "approver";
    const plural = input.action === "issue.reviewers_updated" ? "reviewers" : "approvers";
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, added);
      return input.forIssueDetail ? `added ${changed}` : `added ${changed} to`;
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, removed);
      return input.forIssueDetail ? `removed ${changed}` : `removed ${changed} from`;
    }
    return input.forIssueDetail ? `updated ${plural}` : `updated ${plural} on`;
  }

  return null;
}

export function formatActivityVerb(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action.startsWith("tool_gateway.")) {
    const rawTool = typeof details?.tool === "string"
      ? details.tool
      : typeof details?.upstreamToolName === "string"
        ? details.upstreamToolName
        : "an app action";
    const tool = rawTool.replace(/[._-]+/g, " ");
    const isTest = details?.source === "test";
    if (action === "tool_gateway.call_completed") return `${isTest ? "tested" : "used"} ${tool} on`;
    if (action === "tool_gateway.call_allowed") return `${isTest ? "started a test of" : "was allowed to use"} ${tool} on`;
    if (action === "tool_gateway.call_denied") return `was blocked from using ${tool} on`;
    if (action === "tool_gateway.approval_requested") return `asked to use ${tool} on`;
    if (action === "tool_gateway.session_created") return "opened an app session for";
    if (action === "tool_gateway.session_rejected") return "was blocked from opening an app session for";
    if (action === "tool_gateway.discovery") return "discovered app actions for";
  }

  if (action === "issue.updated") {
    const issueUpdatedVerb = formatIssueUpdatedVerb(details);
    if (issueUpdatedVerb) return issueUpdatedVerb;
  }

  if (action === "issue.stalled_review_decided") {
    const decision = typeof details?.action === "string" ? details.action : null;
    const label = decision ? STALLED_REVIEW_DECISION_LABELS[decision] : null;
    if (label) return `${label} on`;
  }

  const outcomeLabel = formatInteractionOutcomeLabel(action, details);
  if (outcomeLabel) return `${outcomeLabel} on`;

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: false,
  });
  if (structuredChange) return structuredChange;

  return ACTIVITY_ROW_VERBS[action] ?? action.replace(/[._]/g, " ");
}

export function formatIssueActivityAction(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action === "issue.updated") {
    const issueUpdatedAction = formatIssueUpdatedAction(details, options);
    if (issueUpdatedAction) return issueUpdatedAction;
  }

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: true,
  });
  if (structuredChange) return structuredChange;

  if (action === "issue.accepted_plan_decomposition_updated") {
    const detail = formatAcceptedPlanDecompositionDetail(details);
    if (detail) return detail;
  }

  if (action === "issue.stalled_review_decided") {
    const decision = typeof details?.action === "string" ? details.action : null;
    const label = decision ? STALLED_REVIEW_DECISION_LABELS[decision] : null;
    if (label) return label;
  }

  const outcomeLabel = formatInteractionOutcomeLabel(action, details);
  if (outcomeLabel) return outcomeLabel;

  if (action.startsWith("issue.monitor_") && details) {
    const serviceName = typeof details.serviceName === "string" && details.serviceName.trim()
      ? details.serviceName.trim()
      : null;
    const base = ISSUE_ACTIVITY_LABELS[action] ?? action.replace(/[._]/g, " ");
    return serviceName ? `${base} for ${serviceName}` : base;
  }

  if (
    (
      action === "issue.document_created" ||
      action === "issue.document_updated" ||
      action === "issue.document_locked" ||
      action === "issue.document_unlocked" ||
      action === "issue.document_deleted"
    ) &&
    details
  ) {
    const key = typeof details.key === "string" ? details.key : "document";
    const title = typeof details.title === "string" && details.title ? ` (${details.title})` : "";
    return `${ISSUE_ACTIVITY_LABELS[action] ?? action} ${key}${title}`;
  }

  return ISSUE_ACTIVITY_LABELS[action] ?? action.replace(/[._]/g, " ");
}
