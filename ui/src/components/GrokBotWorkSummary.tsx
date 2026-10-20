import { useQuery } from "@tanstack/react-query";
import { grokBotApi } from "@/api/grokBot";
import { Link } from "@/lib/router";
import { useTranslation } from "@/i18n";
/** Reports observed Paperclip activity; this is not a provider availability indicator. */
export function GrokBotWorkSummary({ companyId, agentId }: { companyId: string; agentId: string }) {
  const { t } = useTranslation();
  const state = useQuery({ queryKey: ["grok-binding", companyId, agentId], queryFn: ({ signal }) => grokBotApi.connection(companyId, agentId, signal), retry: false, refetchInterval: 10000 });
  const data = state.data, binding = data?.binding, routine = binding?.routine;
  return <div className="space-y-2 text-sm">
    {state.error && <p role="alert" className="text-destructive">{t("rest.grokBotWorkSummary.connectionStatusCouldNotBe", { message: state.error.message })}</p>}
    <p>{data?.recoveryNeeded ? t("rest.grokBotWorkSummary.recoveryNeeded") : binding?.assignment?.status === "offered" ? t("rest.grokBotWorkSummary.awaitingAcknowledgement") : binding?.assignment ? t("rest.grokBotWorkSummary.workingInGrokBot") : routine?.verified ? t("rest.grokBotWorkSummary.noActivePaperclipWorkSession") : t("rest.grokBotWorkSummary.connectionSetupIncomplete")}</p>
    {data?.currentTask && <Link className="underline" to={`/issues/${data.currentTask.id}`}>{data.currentTask.identifier}: {data.currentTask.title}</Link>}
    <p className="text-muted-foreground">{t("rest.grokBotWorkSummary.queuedTasks")}{" "}{data?.queuedTaskCount ?? t("rest.grokBotWorkSummary.checking")}</p>
    <p className="text-muted-foreground">{t("rest.grokBotWorkSummary.lastContact")}{" "}{routine?.lastContactAt ? new Date(routine.lastContactAt).toLocaleString() : t("rest.grokBotWorkSummary.notObserved")}</p>
    <p className="text-xs text-muted-foreground">{t("rest.grokBotWorkSummary.showsPaperclipreportedActivityOpenThe")}</p>
  </div>;
}
