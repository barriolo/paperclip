import { useEffect, useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ConnectionGrantsResponse,
  ToolConnection,
} from "@paperclipai/shared";
import { browserUseApi } from "@/api/browser-use";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/i18n";

function CredentialSettings({
  companyId,
  grantId,
}: {
  companyId: string;
  grantId: string;
}) {
  const { t } = useTranslation();
  const id = useId();
  const saved = useQuery({
    queryKey: ["browser-use-cloud-settings", grantId],
    queryFn: () => browserUseApi.settings(companyId, grantId),
  });
  const profiles = useQuery({
    queryKey: ["browser-use-cloud-profiles", grantId],
    queryFn: () => browserUseApi.profiles(companyId, grantId),
    retry: false,
  });
  const [allowed, setAllowed] = useState<string[]>([]);
  const [limit, setLimit] = useState("");
  useEffect(() => {
    if (saved.data) {
      setAllowed(saved.data.allowedProfileIds);
      setLimit(saved.data.maxCostUsd?.toString() ?? "");
    }
  }, [saved.data]);
  const save = useMutation({
    mutationFn: () =>
      browserUseApi.saveSettings(companyId, grantId, {
        allowedProfileIds: allowed,
        maxCostUsd: limit ? Number(limit) : null,
      }),
    onSuccess: () => {
      void saved.refetch();
    },
  });
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${id}-limit`}>
          {t("settings.browserUseSettingsPanel.maximumCostPerBrowserRun")}
        </Label>
        <Input
          id={`${id}-limit`}
          type="number"
          min="0"
          step="0.01"
          value={limit}
          placeholder={t("settings.browserUseSettingsPanel.useTheRemainingPaperclipBudget")}
          onChange={(e) => setLimit(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {t("settings.browserUseSettingsPanel.theAgentCanChooseA")}
        </p>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("settings.browserUseSettingsPanel.allowedSavedProfiles")}</legend>
        <p className="text-sm text-muted-foreground">
          {t("settings.browserUseSettingsPanel.freshBrowsersAreTheDefault")}{" "}
          <a
            href="https://cloud.browser-use.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {t("settings.browserUseSettingsPanel.browserUseCloud")}
          </a>
          .
        </p>
        {profiles.data?.map((p) => (
          <Label key={p.id} className="flex items-center gap-2">
            <Checkbox
              checked={allowed.includes(p.id)}
              onCheckedChange={(checked) =>
                setAllowed((previous) =>
                  checked
                    ? [...previous, p.id]
                    : previous.filter((id) => id !== p.id),
                )
              }
            />
            {p.name ?? p.id}
          </Label>
        ))}
        {profiles.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("settings.browserUseSettingsPanel.noSavedProfiles")}</p>
        )}
        {profiles.isLoading && (
          <p className="text-sm text-muted-foreground">{t("settings.browserUseSettingsPanel.loadingProfiles")}</p>
        )}
        {profiles.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t("settings.browserUseSettingsPanel.couldNotLoadProfiles")}{" "}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void profiles.refetch()}
            >
              {t("settings.browserUseSettingsPanel.retry")}
            </Button>
          </p>
        )}
      </fieldset>
      {saved.isError || save.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("settings.browserUseSettingsPanel.couldNotSaveOrLoad")}
        </p>
      ) : null}
      {save.isSuccess && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("settings.browserUseSettingsPanel.browserSettingsSaved")}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={
            !saved.data ||
            save.isPending ||
            Boolean(
              limit && (!Number.isFinite(Number(limit)) || Number(limit) <= 0),
            )
          }
          onClick={() => save.mutate()}
        >
          {t("settings.browserUseSettingsPanel.saveBrowserSettings")}
        </Button>
      </div>
    </div>
  );
}
export function BrowserUseSettingsPanel({
  connection,
  grants,
}: {
  connection: ToolConnection;
  grants?: ConnectionGrantsResponse;
}) {
  const { t } = useTranslation();
  const eligible =
    grants?.grants.filter(
      (g) =>
        g.status === "active" &&
        ((g.kind === "organization" && g.capabilities?.canEditAudience) ||
          g.subjectUserId === grants.currentUserId ||
          g.createdByUserId === grants.currentUserId),
    ) ?? [];
  const [selected, setSelected] = useState("");
  const grantId = selected || eligible[0]?.id;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t("settings.browserUseSettingsPanel.browserSettings")}</h2>
      {eligible.length > 1 && (
        <Label className="flex flex-col gap-2">
          {t("settings.browserUseSettingsPanel.credential")}
          <select
            value={grantId}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-md border bg-background p-2"
          >
            {eligible.map((g, i) => (
              <option key={g.id} value={g.id}>
                {g.kind === "user" ? t("settings.browserUseSettingsPanel.personal") : t("settings.browserUseSettingsPanel.shared")} credential {i + 1}
              </option>
            ))}
          </select>
        </Label>
      )}
      {grantId ? (
        <CredentialSettings
          key={grantId}
          companyId={connection.companyId}
          grantId={grantId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("settings.browserUseSettingsPanel.theCredentialOwnerOrA")}
        </p>
      )}
    </section>
  );
}
