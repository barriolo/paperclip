import { formatDateTime } from "./utils";
import { i18n } from "@/i18n";

type RetryAwareRun = {
  status: string;
  retryOfRunId?: string | null;
  scheduledRetryAt?: string | Date | null;
  scheduledRetryAttempt?: number | null;
  scheduledRetryReason?: string | null;
  retryExhaustedReason?: string | null;
};

export type RunRetryStateSummary = {
  kind: "scheduled" | "exhausted" | "attempted";
  badgeLabel: string;
  tone: string;
  detail: string | null;
  secondary: string | null;
  retryOfRunId: string | null;
};

const RETRY_REASON_LABELS: Record<string, string> = {
  get native_provider_overloaded() {
    return i18n.t("agents.runRetryState.modelAtCapacity");
  },
  get ai_connection_pool_wait() {
    return i18n.t("agents.runRetryState.waitingForPoolUsageTo");
  },
  get transient_failure() {
    return i18n.t("agents.runRetryState.transientFailure");
  },
  get missing_issue_comment() {
    return i18n.t("agents.runRetryState.missingTaskComment");
  },
  get process_lost() {
    return i18n.t("agents.runRetryState.processLost");
  },
  get assignment_recovery() {
    return i18n.t("agents.runRetryState.assignmentRecovery");
  },
  get issue_continuation_needed() {
    return i18n.t("agents.runRetryState.continuationNeeded");
  },
  get max_turns_continuation() {
    return i18n.t("agents.runRetryState.maxturnContinuation");
  },
};

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function joinFragments(parts: Array<string | null>) {
  const filtered = parts.filter((part): part is string => Boolean(part));
  return filtered.length > 0 ? filtered.join(" · ") : null;
}

export function formatRetryReason(reason: string | null | undefined) {
  const normalized = readNonEmptyString(reason);
  if (!normalized) return null;
  return RETRY_REASON_LABELS[normalized] ?? normalized.replace(/_/g, " ");
}

export function describeRunRetryState(run: RetryAwareRun): RunRetryStateSummary | null {
  const attempt =
    typeof run.scheduledRetryAttempt === "number" && Number.isFinite(run.scheduledRetryAttempt) && run.scheduledRetryAttempt > 0
      ? run.scheduledRetryAttempt
      : null;
  const attemptLabel = attempt ? `Attempt ${attempt}` : null;
  const reasonLabel = formatRetryReason(run.scheduledRetryReason);
  const retryOfRunId = readNonEmptyString(run.retryOfRunId);
  const exhaustedReason = readNonEmptyString(run.retryExhaustedReason);
  const dueAt = run.scheduledRetryAt ? formatDateTime(run.scheduledRetryAt) : null;
  const isMaxTurnContinuation = run.scheduledRetryReason === "max_turns_continuation";
  const hasRetryMetadata =
    Boolean(retryOfRunId)
    || Boolean(reasonLabel)
    || Boolean(dueAt)
    || Boolean(attemptLabel)
    || Boolean(exhaustedReason);

  if (!hasRetryMetadata) return null;

  if (run.status === "scheduled_retry") {
    return {
      kind: "scheduled",
      badgeLabel: run.scheduledRetryReason === "ai_connection_pool_wait" ? i18n.t("agents.runRetryState.poolExhausted") : isMaxTurnContinuation ? i18n.t("agents.runRetryState.continuationScheduled") : i18n.t("agents.runRetryState.retryScheduled"),
      tone: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      detail: joinFragments([attemptLabel, reasonLabel]),
      secondary: dueAt
        ? `${isMaxTurnContinuation ? "Next continuation" : "Next retry"} ${dueAt}`
        : `${isMaxTurnContinuation ? "Next continuation" : "Next retry"} pending schedule`,
      retryOfRunId,
    };
  }

  if (exhaustedReason) {
    return {
      kind: "exhausted",
      badgeLabel: isMaxTurnContinuation ? i18n.t("agents.runRetryState.continuationExhausted") : i18n.t("agents.runRetryState.retryExhausted"),
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      detail: joinFragments([attemptLabel, reasonLabel, "Automatic retries exhausted"]),
      secondary: exhaustedReason.includes("Manual intervention required")
        ? exhaustedReason
        : `${exhaustedReason} Manual intervention required.`,
      retryOfRunId,
    };
  }

  return {
    kind: "attempted",
    badgeLabel: isMaxTurnContinuation ? i18n.t("agents.runRetryState.continuedRun") : i18n.t("agents.runRetryState.retriedRun"),
    tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    detail: joinFragments([attemptLabel, reasonLabel]),
    secondary: null,
    retryOfRunId,
  };
}
