import { useQuery } from "@tanstack/react-query";
import type { DecisionHistoryEntry } from "@paperclipai/shared";
import { decisionModelsApi } from "@/api/decision-models";
import { Link } from "@/lib/router";
import { formatDateTime, formatTokens, formatDetailedCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFastResponsesEnabled } from "@/hooks/useFastResponsesEnabled";
import { useTranslation } from "@/i18n";

export function DecisionHistoryTable({ entries, fastResponse = false, connectionsEnabled = true }: { entries: (DecisionHistoryEntry & { publicationStatus?: string; connectionName?: string | null })[]; fastResponse?: boolean; connectionsEnabled?: boolean }) {
  const { t } = useTranslation();
  if (!entries.length) return <p className="text-sm text-muted-foreground">{fastResponse ? t("rest.decisionHistory.noFastResponsesInThis") : t("rest.decisionHistory.noDecisionRequestsInThis")} <Link to={connectionsEnabled ? "/company/settings/connections" : fastResponse ? "/company/settings/instance/experimental" : "/company/settings"} className="underline underline-offset-4">{fastResponse ? connectionsEnabled ? t("rest.decisionHistory.configureFastResponse") : t("rest.decisionHistory.enableExperimentalFastResponses") : t("rest.decisionHistory.configureADecisionModel")}</Link>{" "}{t("rest.decisionHistory.toRunATest")}</p>;
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">{t("rest.decisionHistory.recentRequestsInputsAreNot")}</p>
    <div className="overflow-x-auto"><table className="w-full text-sm" aria-label={fastResponse ? t("rest.decisionHistory.fastResponses") : t("rest.decisionHistory.decisionRequests")}>
      <thead><tr className="border-b border-border text-muted-foreground">{["When / feature", "Responsible", "Task", ...(fastResponse ? ["Connection"] : []), "Model", "Status", "Duration", "Tokens in / out", "Cost"].map(label => <th key={label} className="px-3 py-2 text-left font-medium">{label}</th>)}</tr></thead>
      <tbody>{entries.map(row => <tr key={row.id} className="border-b border-border last:border-0">
        <td className="px-3 py-3"><div className="whitespace-nowrap">{formatDateTime(row.startedAt)}</div><div className="text-xs text-muted-foreground">{row.feature === "settings.test" ? t("rest.decisionHistory.setupTest") : row.feature}</div></td>
        <td className="px-3 py-3">{row.actorType === "system" ? t("rest.decisionHistory.paperclipServices") : row.userName ?? (row.responsibleUserId === "local-board" ? t("rest.decisionHistory.board") : t("rest.decisionHistory.formerUser"))}</td>
        <td className="px-3 py-3">{row.issueId ? <Link className="underline underline-offset-4" to={`/issues/${row.issueIdentifier ?? row.issueId}`}>{row.issueIdentifier ?? t("rest.decisionHistory.viewTask")}</Link> : "—"}</td>
        {fastResponse && <td className="px-3 py-3">{row.connectionName ?? (row.connectionId ? t("rest.decisionHistory.removedConnection") : "—")}</td>}
        <td className="px-3 py-3 font-mono text-xs">{row.model}</td>
        <td className="px-3 py-3"><div>{row.status === "succeeded" ? t("rest.decisionHistory.succeeded") : row.status === "running" ? t("rest.decisionHistory.running") : row.status === "unknown" ? t("rest.decisionHistory.unresolved") : row.status === "skipped" ? t("rest.decisionHistory.skipped") : row.status === "pending" ? t("rest.decisionHistory.pending") : t("rest.decisionHistory.failed")}</div>{row.publicationStatus && <div className="text-xs text-muted-foreground">{row.publicationStatus}</div>}{row.errorCode && <div className="text-xs text-muted-foreground">{row.errorCode.replaceAll("_", " ")}</div>}</td>
        <td className="px-3 py-3 font-mono">{row.durationMs === null ? "—" : `${(row.durationMs / 1000).toFixed(1)}s`}</td>
        <td className="whitespace-nowrap px-3 py-3 font-mono">{row.inputTokens === null ? "—" : formatTokens(row.inputTokens)} / {row.outputTokens === null ? "—" : formatTokens(row.outputTokens)}</td>
        <td className="px-3 py-3 font-mono"><div>{row.costCents === null ? t("rest.decisionHistory.unknown") : formatDetailedCents(row.costCents)}</div>{row.costStatus !== "unpriced" && row.costStatus && <span className="text-xs text-muted-foreground">{row.costStatus === "estimated" ? t("rest.decisionHistory.estimated") : t("rest.decisionHistory.reported")}</span>}</td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}
export function DecisionHistory({ companyId, from, to }: { companyId: string; from?: string | null; to?: string | null }) {
  const { t } = useTranslation();
  const { enabled } = useFastResponsesEnabled();
  const query = useQuery({ queryKey: ["decision-history", companyId, from, to], queryFn: () => decisionModelsApi.history(companyId, from, to), refetchInterval: q => q.state.data?.some(row => row.status === "running") ? 5000 : false });
  if (query.isPending) return <p className="text-sm text-muted-foreground">{t("rest.decisionHistory.loadingDecisionRequests")}</p>;
  if (query.error) return <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{t("rest.decisionHistory.couldNotLoadDecisionRequests")}</p><Button variant="outline" onClick={() => void query.refetch()}>{t("rest.decisionHistory.tryAgain")}</Button></div>;
  return <DecisionHistoryTable entries={query.data ?? []} connectionsEnabled={enabled} />;
}
