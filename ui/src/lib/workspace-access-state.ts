import type {
  WorkspaceOperation,
  WorkspaceReadiness,
  WorkspaceReadinessState,
  WorkspaceRuntimeService,
} from "@paperclipai/shared";
import { i18n } from "@/i18n";

/**
 * Derives the workspace access state the UI shows (PAP-17572).
 *
 * The board cannot read a cloned workspace's protected health directly, so state
 * comes from three server-side facts it *can* see: the live runtime rows, the
 * workspace operation log, and the readiness the control plane reported when it
 * last tried to mint a login handoff.
 *
 * Every state carries one concrete next action. The failure this replaces was a
 * generic "Load failed" (or worse, a green badge) that told an operator nothing
 * about whether to wait, start, repair, or read a log.
 */

export type WorkspaceAccessActionKind =
  | "open"
  | "start"
  | "repair"
  | "view_logs"
  /** Nothing to do but wait for a running operation. */
  | "wait";

export type WorkspaceAccessAction = {
  kind: WorkspaceAccessActionKind;
  label: string;
};

export type WorkspaceAccessNotice = {
  title: string;
  description: string;
  action: WorkspaceAccessAction;
};

export type WorkspaceAccessDisplayState = WorkspaceReadinessState | "stopped";

export type WorkspaceAccessState = {
  state: WorkspaceAccessDisplayState;
  title: string;
  description: string;
  action: WorkspaceAccessAction;
  /** True when a password-independent handoff is the expected way in. */
  handoffAvailable: boolean;
  /** A non-blocking historical failure that is still useful to inspect. */
  secondaryNotice?: WorkspaceAccessNotice;
};

/** What the control plane said the last time a handoff was requested. */
export type WorkspaceLoginHandoffFailureInfo = {
  reason: string;
  detail?: string | null;
  readiness?: WorkspaceReadiness | null;
};

function latestOperation(operations: WorkspaceOperation[], phase: WorkspaceOperation["phase"]) {
  return operations.find((operation) => operation.phase === phase) ?? null;
}

function describeSeedPhase(readiness: WorkspaceReadiness | null | undefined): string | null {
  if (!readiness?.failurePhase && !readiness?.seedPhase) return null;
  return readiness.failurePhase ?? readiness.seedPhase ?? null;
}

function timestampMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function failedRepairNotice(repair: WorkspaceOperation): WorkspaceAccessNotice {
  const phase = typeof repair.metadata?.repairPhase === "string" ? repair.metadata.repairPhase : null;
  return {
    title: i18n.t("rest.workspaceAccessState.repairFailed"),
    description: phase
      ? `The repair stopped during ${phase}. The pre-repair backup was kept.`
      : i18n.t("rest.workspaceAccessState.theRepairStoppedBeforeThe"),
    action: { kind: "view_logs", label: i18n.t("rest.workspaceAccessState.viewRepairLog") },
  };
}

function failedProvisionNotice(provision: WorkspaceOperation): WorkspaceAccessNotice {
  const phase = typeof provision.metadata?.seedFailurePhase === "string"
    ? provision.metadata.seedFailurePhase
    : null;
  return {
    title: i18n.t("rest.workspaceAccessState.databaseProvisioningFailed"),
    description: phase
      ? `The earlier clone attempt failed during ${phase}. The workspace later became usable.`
      : i18n.t("rest.workspaceAccessState.anEarlierCloneAttemptFailed"),
    action: { kind: "view_logs", label: i18n.t("rest.workspaceAccessState.viewProvisioningLog") },
  };
}

const HANDOFF_REASON_COPY: Record<string, string> = {
  get handoff_not_configured() {
    return i18n.t("rest.workspaceAccessState.thisInstanceHasNoWorkspace");
  },
  get no_board_identity() {
    return i18n.t("rest.workspaceAccessState.yourSessionHasNoCloned");
  },
  get runtime_not_running() {
    return i18n.t("rest.workspaceAccessState.noHealthyRuntimeServiceIs");
  },
  get runtime_url_unusable() {
    return i18n.t("rest.workspaceAccessState.theRuntimeRowIsPublishing");
  },
  get workspace_not_ready() {
    return i18n.t("rest.workspaceAccessState.theClonedDatabaseIsNot");
  },
};

const READINESS_FAILURE_COPY: Record<string, string> = {
  get database_unreachable() {
    return i18n.t("rest.workspaceAccessState.theIsolatedDatabaseIsNot");
  },
  get clone_data_missing() {
    return i18n.t("rest.workspaceAccessState.theCloneRestoredNoOrganization");
  },
  get clone_data_unreadable() {
    return i18n.t("rest.workspaceAccessState.theClonedProductTablesCould");
  },
  get cloned_membership_missing() {
    return i18n.t("rest.workspaceAccessState.noClonedUserHasAn");
  },
  get cloned_identity_unreadable() {
    return i18n.t("rest.workspaceAccessState.theClonedIdentityTablesCould");
  },
  get auth_handoff_not_configured() {
    return i18n.t("rest.workspaceAccessState.theWorkspaceWasStartedWithout");
  },
  get seed_manifest_unreadable() {
    return i18n.t("rest.workspaceAccessState.theSeedManifestIsUnreadable");
  },
};

/**
 * Human cause for a readiness rejection, preferring the specific recorded phase
 * over a generic sentence so the copy names what to fix.
 */
export function describeWorkspaceReadinessCause(
  failure: WorkspaceLoginHandoffFailureInfo | null | undefined,
): string | null {
  if (!failure) return null;
  const phase = describeSeedPhase(failure.readiness);
  if (phase && READINESS_FAILURE_COPY[phase]) return READINESS_FAILURE_COPY[phase];
  if (phase) return `Last recorded phase: ${phase}.`;
  if (failure.detail && READINESS_FAILURE_COPY[failure.detail]) return READINESS_FAILURE_COPY[failure.detail];
  return HANDOFF_REASON_COPY[failure.reason] ?? null;
}

export function resolveWorkspaceAccessState(input: {
  runtimeServices: WorkspaceRuntimeService[] | null | undefined;
  operations: WorkspaceOperation[] | null | undefined;
  handoffFailure?: WorkspaceLoginHandoffFailureInfo | null;
}): WorkspaceAccessState {
  const operations = input.operations ?? [];
  const runtimeServices = input.runtimeServices ?? [];
  const repair = latestOperation(operations, "workspace_repair");
  const provision =
    latestOperation(operations, "workspace_seed")
    ?? latestOperation(operations, "workspace_runtime_provision")
    ?? latestOperation(operations, "workspace_provision");
  const failure = input.handoffFailure ?? null;
  const cause = describeWorkspaceReadinessCause(failure);
  const handoffAvailable = failure?.reason !== "handoff_not_configured" && failure?.reason !== "no_board_identity";
  const servingService = runtimeServices.find(
    (service) => service.status === "running" && service.healthStatus === "healthy" && service.url,
  );
  const startingService = runtimeServices.find(
    (service) => service.status === "provisioning" || service.status === "starting",
  );
  const repairFinishedAt = timestampMs(repair?.finishedAt);
  const servingServiceStartedAt = timestampMs(servingService?.startedAt);
  const provisionFinishedAt = timestampMs(provision?.finishedAt);
  const readinessConfirmsServing = Boolean(servingService && failure?.readiness?.state === "ready");
  const runtimeStartedAfterRepair = repairFinishedAt !== null
    && servingServiceStartedAt !== null
    && repairFinishedAt < servingServiceStartedAt;
  const repairFailureWasSuperseded = repair?.status === "failed" && Boolean(
    servingService
    && (readinessConfirmsServing || runtimeStartedAfterRepair),
  );
  const successfulRepairFinishedAt = repair?.status === "succeeded"
    ? timestampMs(repair.finishedAt)
    : null;
  // A failed seed is historical once the workspace is demonstrably serving,
  // or once a later repair has replaced and revalidated that database.
  const provisionFailureWasSuperseded = provision?.status === "failed" && Boolean(
    servingService
    || (
      provisionFinishedAt !== null
      && successfulRepairFinishedAt !== null
      && provisionFinishedAt < successfulRepairFinishedAt
    ),
  );
  const secondaryNotice = repair?.status === "failed" && repairFailureWasSuperseded
    ? failedRepairNotice(repair)
    : provision?.status === "failed" && provisionFailureWasSuperseded
      ? failedProvisionNotice(provision)
      : undefined;

  // A live repair outranks everything: it is already changing the answer.
  if (repair?.status === "running") {
    const phase = typeof repair.metadata?.repairPhase === "string" ? repair.metadata.repairPhase : null;
    return {
      state: "repairing",
      title: i18n.t("rest.workspaceAccessState.repairingWorkspaceDatabase"),
      description: phase
        ? `Only the isolated database is replaced; the git worktree and your files are preserved. Current phase: ${phase}.`
        : i18n.t("rest.workspaceAccessState.onlyTheIsolatedDatabaseIs"),
      action: { kind: "wait", label: i18n.t("rest.workspaceAccessState.repairInProgress") },
      handoffAvailable,
    };
  }
  if (repair?.status === "failed" && !repairFailureWasSuperseded) {
    const notice = failedRepairNotice(repair);
    return {
      state: "failed",
      ...notice,
      handoffAvailable,
    };
  }

  if (provision?.status === "running") {
    return {
      state: "provisioning",
      title: i18n.t("rest.workspaceAccessState.provisioningDatabase"),
      description: i18n.t("rest.workspaceAccessState.restoringTheIsolatedDatabaseClone"),
      action: { kind: "wait", label: i18n.t("rest.workspaceAccessState.provisioning") },
      handoffAvailable,
    };
  }
  if (provision?.status === "failed" && !provisionFailureWasSuperseded) {
    const seedPhase = typeof provision.metadata?.seedFailurePhase === "string"
      ? provision.metadata.seedFailurePhase
      : null;
    return {
      state: "failed",
      title: i18n.t("rest.workspaceAccessState.databaseProvisioningFailed"),
      description: seedPhase
        ? `The clone failed during ${seedPhase}. Repairing replaces only the isolated database.`
        : i18n.t("rest.workspaceAccessState.theCloneDidNotFinish"),
      action: { kind: "repair", label: i18n.t("rest.workspaceAccessState.repairWorkspace") },
      handoffAvailable,
    };
  }

  // Readiness the control plane actually observed beats anything inferred from
  // runtime rows, because it is the only signal that looked inside the clone.
  const staleNotReadyFailure = failure?.reason === "workspace_not_ready" && readinessConfirmsServing;
  if (failure && !staleNotReadyFailure) {
    if (failure.reason === "runtime_not_running" && !servingService && !startingService) {
      return {
        state: "stopped",
        title: i18n.t("rest.workspaceAccessState.workspaceIsNotRunning"),
        description: i18n.t("rest.workspaceAccessState.startTheWorkspaceRuntimeTo"),
        action: { kind: "start", label: i18n.t("rest.workspaceAccessState.startWorkspace") },
        handoffAvailable,
      };
    }
    if (failure.reason === "workspace_not_ready" || failure.reason === "runtime_url_unusable") {
      const readinessState = failure.readiness?.state;
      const validating = readinessState === "validating" || readinessState === "provisioning";
      return {
        state: validating ? "validating" : "degraded",
        title: validating ? i18n.t("rest.workspaceAccessState.validatingClone") : i18n.t("rest.workspaceAccessState.workspaceIsDegraded"),
        description: [
          cause ?? "The workspace is serving, but its clone did not pass the readiness contract.",
          validating ? "Paperclip is still confirming the clone." : "One bounded repair replaces the isolated database.",
        ].join(" "),
        action: validating
          ? { kind: "wait", label: i18n.t("rest.workspaceAccessState.validating") }
          : { kind: "repair", label: i18n.t("rest.workspaceAccessState.repairWorkspace") },
        handoffAvailable,
      };
    }
    if (!handoffAvailable) {
      return {
        state: servingService ? "ready" : "degraded",
        title: servingService ? i18n.t("rest.workspaceAccessState.readySnapshotlocalSignin") : i18n.t("rest.workspaceAccessState.workspaceIsDegraded"),
        description: cause ?? i18n.t("rest.workspaceAccessState.openingTheBoardWillAsk"),
        action: servingService
          ? { kind: "open", label: i18n.t("rest.workspaceAccessState.openWorkspace") }
          : { kind: "start", label: i18n.t("rest.workspaceAccessState.startWorkspace") },
        handoffAvailable: false,
        secondaryNotice,
      };
    }
  }

  if (startingService) {
    return {
      state: "provisioning",
      title: i18n.t("rest.workspaceAccessState.workspaceIsStarting"),
      description: i18n.t("rest.workspaceAccessState.paperclipIsStartingTheWorkspace"),
      action: { kind: "wait", label: i18n.t("rest.workspaceAccessState.startingWorkspace") },
      handoffAvailable,
    };
  }

  if (servingService) {
    return {
      state: "ready",
      title: i18n.t("rest.workspaceAccessState.ready"),
      description: i18n.t("rest.workspaceAccessState.openingTheWorkspaceSignsYou"),
      action: { kind: "open", label: i18n.t("rest.workspaceAccessState.openWorkspace") },
      handoffAvailable,
      secondaryNotice,
    };
  }

  const unhealthyService = runtimeServices.find(
    (service) => service.status === "running" && service.healthStatus !== "healthy",
  );
  if (unhealthyService) {
    return {
      state: "degraded",
      title: i18n.t("rest.workspaceAccessState.workspaceIsDegraded"),
      description: cause
        ?? i18n.t("rest.workspaceAccessState.theRuntimeIsUpBut"),
      action: { kind: "repair", label: i18n.t("rest.workspaceAccessState.repairWorkspace") },
      handoffAvailable,
    };
  }

  return {
    state: "stopped",
    title: i18n.t("rest.workspaceAccessState.workspaceIsNotRunning"),
    description: i18n.t("rest.workspaceAccessState.startTheWorkspaceRuntimeTo"),
    action: { kind: "start", label: i18n.t("rest.workspaceAccessState.startWorkspace") },
    handoffAvailable,
  };
}
