import { Button } from "@/components/ui/button";
import { InlineBanner } from "@/components/InlineBanner";
import { ConnectionChoiceList } from "../ConnectionChoiceList";
import { useTranslation } from "@/i18n";

/** Shared presentation for account reuse, including the requested external app. */
export function RemoteMcpAccountChoice({
  providerName,
  upstreamServiceName,
  connections,
  pendingId,
  error,
  onSelect,
  onCancel,
  onConnectNew,
}: {
  providerName: string;
  upstreamServiceName?: string;
  connections: { id: string; name: string }[];
  pendingId?: string | null;
  error?: string | null;
  onSelect: (id: string) => void;
  onCancel?: () => void;
  onConnectNew: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">
          {upstreamServiceName
            ? t("rest.remoteMcpAccountChoice.connectThrough", { upstreamServiceName: upstreamServiceName, providerName: providerName })
            : t("rest.remoteMcpAccountChoice.connect", { providerName: providerName })}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("rest.remoteMcpAccountChoice.useAnExistingConnectionOr")}
        </p>
      </div>
      {upstreamServiceName && (
        <InlineBanner compact>
          {t("rest.remoteMcpAccountChoice.isAnExternalServiceThat", { providerName: providerName, upstreamServiceName: upstreamServiceName })}
        </InlineBanner>
      )}
      <ConnectionChoiceList
        choices={connections.map((connection) => ({
          ...connection,
          description: "Provider account available",
        }))}
        pendingId={pendingId}
        onSelect={onSelect}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={Boolean(pendingId)}
          onClick={onCancel}
        >
          {t("rest.remoteMcpAccountChoice.cancel")}
        </Button>
        <Button disabled={Boolean(pendingId)} onClick={onConnectNew}>
          {t("rest.remoteMcpAccountChoice.connectNew")}
        </Button>
      </div>
    </div>
  );
}
