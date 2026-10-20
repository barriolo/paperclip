import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FlaskConical, Lock, Play } from "lucide-react";
import type {
  InstanceExperimentalSettings,
  InstanceExperimentalSettingsWithManaged,
  InstanceFeatureKey,
  ManagedSettingMetadata,
  PatchInstanceExperimentalSettings,
} from "@paperclipai/shared";
import { experimentalSettingKey } from "@paperclipai/shared";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { useHiddenSettings } from "@/hooks/useHiddenSettings";
import { getWorktreeInstanceId, isWorktreeRuntime } from "../lib/worktree-branding";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/lib/router";
import { useTranslation } from "@/i18n";

type WorktreeRunExecutionDisplayState =
  | { kind: "off" }
  | { kind: "armed"; activatedAt: string }
  | { kind: "fail_closed"; reason: "missing_cutoff" | "missing_instance_id" | "instance_mismatch" };

/**
 * Mirror of the server's `resolveWorktreeRunExecutionActivation` fail-closed
 * ladder (server/src/services/instance-settings.ts) so the card never claims a
 * copied/legacy row is arming execution. The derived fields are display-only —
 * the PATCH the toggle sends still writes just the boolean.
 */
function resolveWorktreeRunExecutionDisplayState(
  settings:
    | Pick<
        InstanceExperimentalSettings,
        | "enableWorktreeRunExecution"
        | "worktreeRunExecutionActivatedAt"
        | "worktreeRunExecutionActivationInstanceId"
      >
    | undefined,
  currentInstanceId: string | null,
): WorktreeRunExecutionDisplayState {
  if (settings?.enableWorktreeRunExecution !== true) return { kind: "off" };
  if (!settings.worktreeRunExecutionActivatedAt) return { kind: "fail_closed", reason: "missing_cutoff" };
  if (!currentInstanceId) return { kind: "fail_closed", reason: "missing_instance_id" };
  if (settings.worktreeRunExecutionActivationInstanceId !== currentInstanceId) {
    return { kind: "fail_closed", reason: "instance_mismatch" };
  }
  return { kind: "armed", activatedAt: settings.worktreeRunExecutionActivatedAt };
}

function formatActivationTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// PAP-11233: keep Conference Room code intact, but hide the user-facing opt-in for now.
const SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING = false;

function ManagedByCloudBadge() {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Lock aria-hidden="true" />
      {t("settings.instanceExperimentalSettings.managedByPaperclipCloud")}
    </Badge>
  );
}

function ExperimentalToggleCard({
  title,
  description,
  footnote,
  checked,
  onCheckedChange,
  disabled,
  settingKey,
  managed,
  ariaLabel,
}: {
  title: string;
  description: string;
  footnote?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
  /** Flag key backing this card; operator-hidden keys render nothing. */
  settingKey: InstanceFeatureKey;
  managed?: ManagedSettingMetadata;
  ariaLabel: string;
}) {
  const { hidden: hiddenSettings } = useHiddenSettings();
  const isManaged = managed?.managed === true;
  if (hiddenSettings.has(experimentalSettingKey(settingKey))) return null;
  return (
    <Card className="block bg-transparent p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {isManaged ? <ManagedByCloudBadge /> : null}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          {footnote ? <p className="max-w-2xl text-xs text-muted-foreground">{footnote}</p> : null}
        </div>
        <ToggleSwitch
          checked={checked}
          onCheckedChange={(next) => {
            if (isManaged) return;
            onCheckedChange(next);
          }}
          disabled={disabled || isManaged}
          aria-label={ariaLabel}
        />
      </div>
    </Card>
  );
}

export function InstanceExperimentalSettings() {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const { hidden: hiddenSettings } = useHiddenSettings();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: t("settings.instanceExperimentalSettings.settings"), href: "/company/settings" },
      { label: t("settings.instanceExperimentalSettings.experimental") },
    ]);
  }, [setBreadcrumbs, t]);

  const experimentalQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const toggleMutation = useMutation<
    InstanceExperimentalSettingsWithManaged,
    Error,
    PatchInstanceExperimentalSettings,
    { previousSettings?: InstanceExperimentalSettingsWithManaged }
  >({
    mutationFn: async (patch: PatchInstanceExperimentalSettings) =>
      instanceSettingsApi.updateExperimental(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.instance.experimentalSettings });
      const previousSettings = queryClient.getQueryData<InstanceExperimentalSettingsWithManaged>(
        queryKeys.instance.experimentalSettings,
      );
      if (previousSettings) {
        queryClient.setQueryData<InstanceExperimentalSettingsWithManaged>(
          queryKeys.instance.experimentalSettings,
          { ...previousSettings, ...patch },
        );
      }
      return { previousSettings };
    },
    onSuccess: async (updatedSettings) => {
      setActionError(null);
      queryClient.setQueryData(queryKeys.instance.experimentalSettings, updatedSettings);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adapters.all }),
        queryClient.invalidateQueries({ queryKey: ["built-in-agents"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
        queryClient.invalidateQueries({ queryKey: ["apps"] }),
      ]);
    },
    onError: (error, _patch, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.instance.experimentalSettings, context.previousSettings);
      }
      setActionError(error instanceof Error ? error.message : "Failed to update experimental settings.");
    },
  });

  if (experimentalQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t("settings.instanceExperimentalSettings.loadingExperimentalSettings")}</div>;
  }

  if (experimentalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {experimentalQuery.error instanceof Error
          ? experimentalQuery.error.message
          : "Failed to load experimental settings."}
      </div>
    );
  }

  const inWorktree = isWorktreeRuntime();
  // Present only on cloud-managed instances: keys the managed overlay controls
  // render locked with the "Managed by Paperclip Cloud" badge. Self-hosted
  // responses carry no `managedKeys`, so every card stays editable.
  const managedKeys = experimentalQuery.data?.managedKeys ?? {};
  const enableWorktreeRunExecution = experimentalQuery.data?.enableWorktreeRunExecution === true;
  const worktreeRunExecutionManaged = managedKeys.enableWorktreeRunExecution?.managed === true;
  const worktreeRunExecutionState = resolveWorktreeRunExecutionDisplayState(
    experimentalQuery.data,
    getWorktreeInstanceId(),
  );
  const enableEnvironments = experimentalQuery.data?.enableEnvironments === true;
  const enableNativeRunner = experimentalQuery.data?.enableNativeRunner === true;
  const enableChatConnectors = experimentalQuery.data?.enableChatConnectors === true;
  const enableManagedSandboxOnly = experimentalQuery.data?.enableManagedSandboxOnly === true;
  const enableIsolatedWorkspaces = experimentalQuery.data?.enableIsolatedWorkspaces === true;
  const enableIsolatedWorkspacesByDefault =
    experimentalQuery.data?.enableIsolatedWorkspacesByDefault === true;
  // Streamlined left navigation is now the standard sidebar (PAP-12472); the
  // experimental opt-out was retired, so it no longer surfaces a toggle here.
  const enableStreamlinedUi = experimentalQuery.data?.enableStreamlinedUi !== false;
  const enableConferenceRoomChat = experimentalQuery.data?.enableConferenceRoomChat === true;
  const enableClassicTaskInterface = experimentalQuery.data?.enableClassicTaskInterface === true;
  const enableIssuePlanDecompositions =
    experimentalQuery.data?.enableIssuePlanDecompositions === true;
  const enableExperimentalFileViewer =
    experimentalQuery.data?.enableExperimentalFileViewer === true;
  const enableExternalObjects = experimentalQuery.data?.enableExternalObjects === true;
  const enableBuiltInAgents = experimentalQuery.data?.enableBuiltInAgents === true;
  const enableBetaSkills = experimentalQuery.data?.enableBetaSkills === true;
  const enableSummaries = experimentalQuery.data?.enableSummaries === true;
  const enableStatusCards = experimentalQuery.data?.enableStatusCards === true;
  const summariesManaged = managedKeys.enableSummaries?.managed === true;
  const statusCardsManaged = managedKeys.enableStatusCards?.managed === true;
  const statusCardsBlockedByManagedSummaries = summariesManaged && !enableSummaries;
  const summariesRequiredByManagedStatusCards = statusCardsManaged && enableStatusCards;
  const enableDecisions = experimentalQuery.data?.enableDecisions === true;
  const enableGoalsSidebarLink = experimentalQuery.data?.enableGoalsSidebarLink === true;
  const enableCases = experimentalQuery.data?.enableCases === true;
  const enableServerInfoDebugView = experimentalQuery.data?.enableServerInfoDebugView === true;
  const enablePaperclipDeveloperMode =
    experimentalQuery.data?.enablePaperclipDeveloperMode === true;
  const enableSimplifiedEnglishInteractions =
    experimentalQuery.data?.enableSimplifiedEnglishInteractions === true;
  const enableFirstTaskPlanProposal =
    experimentalQuery.data?.enableFirstTaskPlanProposal === true;
  const enableSmokeLab = experimentalQuery.data?.enableSmokeLab === true;
  const autoRestartDevServerWhenIdle = experimentalQuery.data?.autoRestartDevServerWhenIdle === true;
  const isVisible = (key: InstanceFeatureKey) => !hiddenSettings.has(experimentalSettingKey(key));
  const showWorktreeRunExecution = inWorktree && isVisible("enableWorktreeRunExecution");
  const showDeveloperSection = showWorktreeRunExecution || ([
    "autoRestartDevServerWhenIdle",
    "enableManagedSandboxOnly",
    "enablePaperclipDeveloperMode",
    "enableServerInfoDebugView",
    "enableSmokeLab",
    "enableIssuePlanDecompositions",
  ] satisfies InstanceFeatureKey[]).some(isVisible);
  const showLegacySection = isVisible("enableClassicTaskInterface") || isVisible("enableGoalsSidebarLink");
  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t("settings.instanceExperimentalSettings.experimental")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("settings.instanceExperimentalSettings.optIntoFeaturesThatAre")}
        </p>
      </div>

      <div
        role="alert"
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{t("settings.instanceExperimentalSettings.experimentalFeaturesMayBreakAt")}</p>
            <p className="text-muted-foreground">
              {t("settings.instanceExperimentalSettings.theseFeaturesAreOptinAnd")}
            </p>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <section className="space-y-3" aria-labelledby="experimental-features-heading">
        <div className="space-y-1">
          <h2 id="experimental-features-heading" className="text-sm font-semibold">
            {t("settings.instanceExperimentalSettings.experimentalFeatures")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("settings.instanceExperimentalSettings.optionalProductFeaturesThatAre")}
          </p>
        </div>

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.agentChat")}
          description={t("settings.instanceExperimentalSettings.talkToEachAgentIn")}
          footnote="Turning this off preserves conversations and lets active runs finish, but prevents new messages."
          checked={experimentalQuery.data?.enableAgentChat ?? false}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableAgentChat: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableAgentChat"
          managed={managedKeys.enableAgentChat}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleAgentChatExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.assistantConnectionsMcp")}
          description={t("settings.instanceExperimentalSettings.connectCodexClaudeAndOther")}
          footnote={<>{t("settings.instanceExperimentalSettings.requiresAnAuthenticatedInstanceWith")}{experimentalQuery.data?.enablePublicMcp && <> <Link className="underline" to="/apps/assistant-connection">{t("settings.instanceExperimentalSettings.setUpAnAssistantConnection")}</Link></>}</>}
          checked={experimentalQuery.data?.enablePublicMcp === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enablePublicMcp: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enablePublicMcp"
          managed={managedKeys.enablePublicMcp}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleAssistantConnectionsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.betaSkills")}
          description={t("settings.instanceExperimentalSettings.allowAgentsToPinBeta")}
          checked={enableBetaSkills}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableBetaSkills: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableBetaSkills"
          managed={managedKeys.enableBetaSkills}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleBetaSkillsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.builtinAgents")}
          description={t("settings.instanceExperimentalSettings.showPaperclipmanagedBuiltinAgentSurfaces")}
          checked={enableBuiltInAgents}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableBuiltInAgents: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableBuiltInAgents"
          managed={managedKeys.enableBuiltInAgents}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleBuiltinAgentsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.cases")}
          description={t("settings.instanceExperimentalSettings.durableWorkProductsBlogPosts")}
          footnote="Turning Cases off hides the tab and blocks the case API; existing case data is kept."
          checked={enableCases}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableCases: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableCases"
          managed={managedKeys.enableCases}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleCasesExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.chatConnectors")}
          description={t("settings.instanceExperimentalSettings.connectAgentsToSlackDiscord")}
          footnote="Turning this off hides experimental chat setup and connected-task controls. Existing chat connections keep running. AgentMail, GitHub review bots, and tool connectors are controlled separately."
          checked={enableChatConnectors}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableChatConnectors: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableChatConnectors"
          managed={managedKeys.enableChatConnectors}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleChatConnectorsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.combinedInboxTaskList")}
          description={t("settings.instanceExperimentalSettings.foldInboxIntoTasksOne")}
          footnote="Old Inbox links redirect to the matching view. Turning this off restores the separate Inbox; no data changes."
          checked={experimentalQuery.data?.enableCombinedInboxTasks ?? false}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableCombinedInboxTasks: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableCombinedInboxTasks"
          managed={managedKeys.enableCombinedInboxTasks}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleCombinedInboxAndTask")}
        />

        {SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING ? (
          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.conferenceRoomChat")}
            description={t("settings.instanceExperimentalSettings.addsAConferenceRoomOne")}
            checked={enableConferenceRoomChat}
            onCheckedChange={(checked) => toggleMutation.mutate({ enableConferenceRoomChat: checked })}
            disabled={toggleMutation.isPending}
            settingKey="enableConferenceRoomChat"
            managed={managedKeys.enableConferenceRoomChat}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleConferenceRoomChatExperimental")}
          />
        ) : null}

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.decisions")}
          description={t("settings.instanceExperimentalSettings.showTheDecisionsItemIn")}
          checked={enableDecisions}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableDecisions: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableDecisions"
          managed={managedKeys.enableDecisions}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleDecisionsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.enableEnvironments")}
          description={t("settings.instanceExperimentalSettings.showEnvironmentManagementInCompany")}
          checked={enableEnvironments}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableEnvironments: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableEnvironments"
          managed={managedKeys.enableEnvironments}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleEnvironmentsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.enableExternalObjects")}
          description={t("settings.instanceExperimentalSettings.detectExternalUrlsInIssues")}
          checked={enableExternalObjects}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableExternalObjects: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableExternalObjects"
          managed={managedKeys.enableExternalObjects}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleExternalObjectsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.enableIsolatedWorkspaces")}
          description={t("settings.instanceExperimentalSettings.showExecutionWorkspaceControlsIn")}
          checked={enableIsolatedWorkspaces}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableIsolatedWorkspaces: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableIsolatedWorkspaces"
          managed={managedKeys.enableIsolatedWorkspaces}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleIsolatedWorkspacesExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.experimentalFastResponses")}
          description={t("settings.instanceExperimentalSettings.showConnectionsInCompanySettings")}
          checked={experimentalQuery.data?.enableFastResponses ?? false}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableFastResponses: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableFastResponses"
          managed={managedKeys.enableFastResponses}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleFastResponsesExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.experimentalFileViewer")}
          description="Show task detail controls for browsing and previewing workspace files relative to a task."
          checked={enableExperimentalFileViewer}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableExperimentalFileViewer: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableExperimentalFileViewer"
          managed={managedKeys.enableExperimentalFileViewer}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleExperimentalFileViewerSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.firstTaskProposeWithA")}
          description={t("settings.instanceExperimentalSettings.whenTheUsersFirstRequest")}
          checked={enableFirstTaskPlanProposal}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ enableFirstTaskPlanProposal: checked })
          }
          disabled={toggleMutation.isPending}
          settingKey="enableFirstTaskPlanProposal"
          managed={managedKeys.enableFirstTaskPlanProposal}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleFirstTaskPlanProposal")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.gitHubReviewBots")}
          description={t("settings.instanceExperimentalSettings.connectAgentsToGithubWith")}
          footnote="Independent of Chat connectors. Turning this off hides setup and management; existing bots keep running. GitHub tool connections stay available."
          checked={experimentalQuery.data?.enableGitHubReviewBots === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableGitHubReviewBots: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableGitHubReviewBots"
          managed={managedKeys.enableGitHubReviewBots}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleGithubReviewBotsExperimental")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.grokBot")}
          description={t("settings.instanceExperimentalSettings.connectAnExistingGrokBot")}
          footnote="Requires Assistant connections (MCP), Paperclip Runner, and authenticated public HTTPS. Usage is not reported. Turning this off blocks Grok calls and new dispatch."
          checked={experimentalQuery.data?.enableGrokBot === true}
          onCheckedChange={checked => toggleMutation.mutate({ enableGrokBot: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableGrokBot" managed={managedKeys.enableGrokBot}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleGrokBotExperimentalSetting")}
        />


        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.memoryConnectors")}
          description={t("settings.instanceExperimentalSettings.connectMem0ZepSupermemoryCognee")}
          footnote="Turning this off hides setup for these connectors. Existing connections keep running."
          checked={experimentalQuery.data?.enableMemoryConnectors === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableMemoryConnectors: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableMemoryConnectors"
          managed={managedKeys.enableMemoryConnectors}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleMemoryConnectorsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.musePersonalAgent")}
          description={t("settings.instanceExperimentalSettings.connectYourPersonalMetaMuse")}
          footnote="Requires Paperclip Runner and an authenticated instance with a public HTTPS URL. Turning this off blocks new work; cleanup and stop evidence remain available. Provider usage and cost are unavailable."
          checked={experimentalQuery.data?.enableMuse === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableMuse: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableMuse"
          managed={managedKeys.enableMuse}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleMuseExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.openAIDot")}
          description={t("settings.instanceExperimentalSettings.addOpenaiDotAsA")}
          footnote="Requires Assistant connections (MCP) and an authenticated instance with a public HTTPS URL. Turning this off blocks Dot calls and new work; saved connections are kept."
          checked={experimentalQuery.data?.enableOpenAiDot === true}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableOpenAiDot: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableOpenAiDot"
          managed={managedKeys.enableOpenAiDot}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleOpenaiDotExperimentalSetting")}
        />


        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.paperclipRunner")}
          description={t("settings.instanceExperimentalSettings.allowNewCodexAgentsTo")}
          checked={enableNativeRunner}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ enableNativeRunner: checked })
          }
          disabled={toggleMutation.isPending}
          settingKey="enableNativeRunner"
          managed={managedKeys.enableNativeRunner}
          ariaLabel={t("settings.instanceExperimentalSettings.togglePaperclipRunnerExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.simplifiedEnglishInteractions")}
          description={t("settings.instanceExperimentalSettings.instructAgentsToWriteUser")}
          checked={enableSimplifiedEnglishInteractions}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ enableSimplifiedEnglishInteractions: checked })
          }
          disabled={toggleMutation.isPending}
          settingKey="enableSimplifiedEnglishInteractions"
          managed={managedKeys.enableSimplifiedEnglishInteractions}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleSimplifiedEnglishInteractionsExperimental")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.statusCards")}
          description={t("settings.instanceExperimentalSettings.enableTheExperimentalSharedStatuscard")}
          footnote="Enabling Status Cards also enables Summaries."
          checked={enableStatusCards}
          onCheckedChange={(checked) =>
            toggleMutation.mutate(
              checked
                ? { enableSummaries: true, enableStatusCards: true }
                : { enableStatusCards: false },
            )
          }
          disabled={toggleMutation.isPending || statusCardsBlockedByManagedSummaries}
          settingKey="enableStatusCards"
          managed={managedKeys.enableStatusCards}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleStatusCardsExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.streamlinedUi")}
          description={t("settings.instanceExperimentalSettings.useTheSimplifiedMainSidebar")}
          footnote="Turning this off restores the legacy shell and navigation. Task and page data are unchanged."
          checked={enableStreamlinedUi}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableStreamlinedUi: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableStreamlinedUi"
          managed={managedKeys.enableStreamlinedUi}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleStreamlinedUiExperimentalSetting")}
        />

        <ExperimentalToggleCard
          title={t("settings.instanceExperimentalSettings.summaries")}
          description={t("settings.instanceExperimentalSettings.showSummarizergeneratedStatusSlotsOn")}
          footnote="Status Cards requires Summaries. Disabling Summaries also disables Status Cards."
          checked={enableSummaries}
          onCheckedChange={(checked) =>
            toggleMutation.mutate(
              checked || !enableStatusCards
                ? { enableSummaries: checked }
                : { enableSummaries: false, enableStatusCards: false },
            )
          }
          disabled={toggleMutation.isPending || summariesRequiredByManagedStatusCards}
          settingKey="enableSummaries"
          managed={managedKeys.enableSummaries}
          ariaLabel={t("settings.instanceExperimentalSettings.toggleSummariesExperimentalSetting")}
        />

        {enableIsolatedWorkspaces && (
          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.useIsolatedWorkspacesByDefault")}
            description={t("settings.instanceExperimentalSettings.treatAProjectThatHas")}
            checked={enableIsolatedWorkspacesByDefault}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableIsolatedWorkspacesByDefault: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableIsolatedWorkspacesByDefault"
            managed={managedKeys.enableIsolatedWorkspacesByDefault}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleIsolatedWorkspacesByDefault")}
          />
        )}
      </section>

      {showDeveloperSection ? (
        <section className="space-y-3" aria-labelledby="developer-mode-heading">
          <div className="space-y-1">
            <h2 id="developer-mode-heading" className="text-sm font-semibold">
              {t("settings.instanceExperimentalSettings.paperclipDeveloperMode")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("settings.instanceExperimentalSettings.internalToolsForDevelopingTesting")}
            </p>
          </div>

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.autoRestartDevServerWhenIdle")}
            description={t("settings.instanceExperimentalSettings.inPnpmDevonceWaitFor")}
            checked={autoRestartDevServerWhenIdle}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ autoRestartDevServerWhenIdle: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="autoRestartDevServerWhenIdle"
            managed={managedKeys.autoRestartDevServerWhenIdle}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleGuardedDevserverAutorestart")}
          />

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.managedEnvironmentOnly")}
            description={t("settings.instanceExperimentalSettings.hideTheLocalEnvironmentAnd")}
            checked={enableManagedSandboxOnly}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableManagedSandboxOnly: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableManagedSandboxOnly"
            managed={managedKeys.enableManagedSandboxOnly}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleManagedEnvironmentOnlyExperimental")}
          />

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.paperclipDeveloperMode")}
            description={t("settings.instanceExperimentalSettings.showInternalPaperclipMaintainerTools")}
            checked={enablePaperclipDeveloperMode}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enablePaperclipDeveloperMode: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enablePaperclipDeveloperMode"
            managed={managedKeys.enablePaperclipDeveloperMode}
            ariaLabel={t("settings.instanceExperimentalSettings.togglePaperclipDeveloperModeExperimental")}
          />

          {showWorktreeRunExecution ? (
            <Card className="block bg-transparent p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{t("settings.instanceExperimentalSettings.runTasksInThisWorktree")}</h3>
                      {worktreeRunExecutionManaged ? <ManagedByCloudBadge /> : null}
                    </div>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      {t("settings.instanceExperimentalSettings.thisIsAnIsolatedGitworktree")}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={enableWorktreeRunExecution}
                    onCheckedChange={(checked) => {
                      if (worktreeRunExecutionManaged) return;
                      toggleMutation.mutate({ enableWorktreeRunExecution: checked });
                    }}
                    disabled={toggleMutation.isPending || worktreeRunExecutionManaged}
                    aria-label={t("settings.instanceExperimentalSettings.toggleWorktreeRunExecutionSetting")}
                  />
                </div>

                {worktreeRunExecutionState.kind === "armed" ? (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-foreground">
                    <Play className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      {t("settings.instanceExperimentalSettings.runningTasksCreatedAfter")}{" "}
                      <span className="font-medium">
                        {formatActivationTimestamp(worktreeRunExecutionState.activatedAt)}
                      </span>
                      .
                    </span>
                  </div>
                ) : null}

                {worktreeRunExecutionState.kind === "fail_closed" ? (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{t("settings.instanceExperimentalSettings.executionIsSuppressedEffectivelyOff")}</p>
                      <p className="text-muted-foreground">
                        {worktreeRunExecutionState.reason === "instance_mismatch"
                          ? "This setting was armed in a different instance and copied here, so no tasks run automatically."
                          : "This setting is missing its activation cutoff, so no tasks run automatically."}{" "}{t("settings.instanceExperimentalSettings.toggleItOffAndBack")}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.serverInfoDebugView")}
            description={t("settings.instanceExperimentalSettings.showAServerSectionIn")}
            checked={enableServerInfoDebugView}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableServerInfoDebugView: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableServerInfoDebugView"
            managed={managedKeys.enableServerInfoDebugView}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleServerInfoDebugView")}
          />

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.smokeLab")}
            description={t("settings.instanceExperimentalSettings.addASmokeLabTab")}
            checked={enableSmokeLab}
            onCheckedChange={(checked) => toggleMutation.mutate({ enableSmokeLab: checked })}
            disabled={toggleMutation.isPending}
            settingKey="enableSmokeLab"
            managed={managedKeys.enableSmokeLab}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleSmokeLabExperimentalSetting")}
          />

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.taskPlanDecomposition")}
            description={t("settings.instanceExperimentalSettings.showAcceptedplanDecompositionHistoryOn")}
            checked={enableIssuePlanDecompositions}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableIssuePlanDecompositions: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableIssuePlanDecompositions"
            managed={managedKeys.enableIssuePlanDecompositions}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleTaskPlanDecompositionPanel")}
          />
        </section>
      ) : null}

      {showLegacySection ? (
        <section className="space-y-3" aria-labelledby="legacy-heading">
          <div className="space-y-1">
            <h2 id="legacy-heading" className="text-sm font-semibold">
              {t("settings.instanceExperimentalSettings.legacy")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("settings.instanceExperimentalSettings.theseFeaturesAreGoingTo")}</p>
          </div>

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.classicTaskInterface")}
            description={t("settings.instanceExperimentalSettings.restoresThePreviousTaskDetail")}
            footnote="Switching takes effect immediately. No task data is affected."
            checked={enableClassicTaskInterface}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableClassicTaskInterface: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableClassicTaskInterface"
            managed={managedKeys.enableClassicTaskInterface}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleClassicTaskInterfaceExperimental")}
          />

          <ExperimentalToggleCard
            title={t("settings.instanceExperimentalSettings.goalsSidebarLink")}
            description={t("settings.instanceExperimentalSettings.restoreTheGoalsItemIn")}
            checked={enableGoalsSidebarLink}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ enableGoalsSidebarLink: checked })
            }
            disabled={toggleMutation.isPending}
            settingKey="enableGoalsSidebarLink"
            managed={managedKeys.enableGoalsSidebarLink}
            ariaLabel={t("settings.instanceExperimentalSettings.toggleGoalsSidebarLinkExperimental")}
          />
        </section>
      ) : null}
    </div>
  );
}
