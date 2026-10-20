import { useState } from "react";
import { AlertTriangle, CircleHelp, ExternalLink, Loader2 } from "lucide-react";
import type { ChatEndpoint } from "@/api/chatEndpoints";
import { SetupWizardFooter } from "@/components/SetupWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/lib/router";
import { gitHubAppSettingsUrl } from "./GitHubAppIdentity";
import { useTranslation } from "@/i18n";

export function GitHubConnectionRecoveryNotice({ endpoint }: { endpoint: ChatEndpoint }) {
  const { t } = useTranslation();
  if (!["attention", "revoked"].includes(endpoint.status)) return null;
  return (
    <section aria-label={t("rest.gitHubConnectionRecovery.gitHubConnectionNeedsRepair")} className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="min-w-0 space-y-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{endpoint.status === "revoked" ? t("rest.gitHubConnectionRecovery.gitHubBotIsDisconnected") : t("rest.gitHubConnectionRecovery.gitHubConnectionNeedsRepair")}</h2>
          <p className="text-sm">{t("rest.gitHubConnectionRecovery.reconnectThisBotToRestore")}</p>
        </div>
        <Button asChild><Link to={`/apps/chat/connect?provider=github&resume=${endpoint.id}&reconnect=1`}>{t("rest.gitHubConnectionRecovery.reconnectGithub")}</Link></Button>
        {(endpoint.lastError || endpoint.healthMessage) && <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{t("rest.gitHubConnectionRecovery.connectionDetails")}</summary>
          <p className="mt-2 break-words">{endpoint.lastError ?? endpoint.healthMessage}</p>
        </details>}
      </div>
    </section>
  );
}

export type GitHubAppCredentials = { appId: string; privateKey: string; webhookSecret: string };

function CredentialLabel({ id, label, help }: { id: string; label: string; help: string }) {
  const { t } = useTranslation();
  return <div className="flex items-center gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Tooltip><TooltipTrigger asChild><button type="button" aria-label={t("rest.gitHubConnectionRecovery.helpWith", { label: label })} className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
      <CircleHelp className="size-3.5" aria-hidden="true" />
    </button></TooltipTrigger><TooltipContent className="max-w-xs">{help}</TooltipContent></Tooltip>
  </div>;
}

export function GitHubAppRecovery({ endpoint, reconnect, onConnect, onExit }: {
  endpoint: ChatEndpoint;
  reconnect: boolean;
  onConnect: (credentials?: GitHubAppCredentials) => Promise<void>;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const [replace, setReplace] = useState(!reconnect);
  const [credentials, setCredentials] = useState<GitHubAppCredentials>({ appId: endpoint.botExternalId ?? "", privateKey: "", webhookSecret: "" });
  const [privateKeyDraft, setPrivateKeyDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const needsWebhookSecret = !reconnect && !["active", "paused", "revoked"].includes(endpoint.status);
  const appName = endpoint.botLabel ?? endpoint.setup?.github?.appName ?? "your existing App";
  const appIdInvalid = !!credentials.appId.trim() && !/^\d+$/.test(credentials.appId.trim());
  const keyInvalid = !!credentials.privateKey.trim() && !/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(credentials.privateKey);
  const keyLoaded = !!credentials.privateKey.trim() && !keyInvalid && !privateKeyDraft;
  const incomplete = replace && (!credentials.appId.trim() || !credentials.privateKey.trim() || appIdInvalid || keyInvalid || (needsWebhookSecret && !credentials.webhookSecret.trim()));
  const actionLabel = pending ? t("rest.gitHubConnectionRecovery.checkingGithub") : replace ? (reconnect ? t("rest.gitHubConnectionRecovery.verifyAndReconnect") : t("rest.gitHubConnectionRecovery.connectExistingApp")) : t("rest.gitHubConnectionRecovery.reconnectSavedApp");
  async function connect() {
    setPending(true);
    setError("");
    try { await onConnect(replace ? credentials : undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reconnect GitHub. Try again."); }
    finally { setPending(false); }
  }
  return <div className="space-y-6">
    {reconnect && <div className="space-y-3">
      <p className="text-sm">{t("rest.gitHubConnectionRecovery.restore")}{" "}<strong>{appName}</strong>{" "}{t("rest.gitHubConnectionRecovery.usingItsSavedCredentialsPaperclip")}</p>
      <p className="text-sm text-muted-foreground">{t("rest.gitHubConnectionRecovery.yourAgentRepositoryChoicesReview")}</p>
    </div>}
    {error && <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <p className="font-medium">{replace ? t("rest.gitHubConnectionRecovery.couldNotReconnectThisApp") : t("rest.gitHubConnectionRecovery.couldNotReconnectTheSaved")}</p>
      <p className="break-words">{error}</p>
      <p>{t("rest.gitHubConnectionRecovery.tryAgainIfTheService")}</p>
    </div>}
    {reconnect && <Button variant="link" className="h-auto p-0" disabled={pending} onClick={() => { setReplace(!replace); setError(""); }}>
      {replace ? t("rest.gitHubConnectionRecovery.useSavedCredentialsInstead") : t("rest.gitHubConnectionRecovery.replaceAppCredentials")}
    </Button>}
    {replace && <div className="space-y-6">
      <div className="space-y-2 text-sm">
        <h2 className="text-base font-semibold">{reconnect ? t("rest.gitHubConnectionRecovery.replaceCredentialsForTheSame") : t("rest.gitHubConnectionRecovery.connectYourExistingGithubApp")}</h2>
        <p><a href={gitHubAppSettingsUrl(endpoint)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">{t("rest.gitHubConnectionRecovery.openGithubAppSettings")}<ExternalLink className="size-3.5" /></a>{" "}{t("rest.gitHubConnectionRecovery.andChoose")}{" "}<strong>{appName}</strong>.</p>
        <p className="text-muted-foreground">{t("rest.gitHubConnectionRecovery.ifItsOwnedByAn")}</p>
      </div>
      <div className="space-y-2">
        <CredentialLabel id="github-app-id" label={t("rest.gitHubConnectionRecovery.appId")} help="The numeric App ID on the GitHub App’s settings page. This is different from its Client ID or installation ID." />
        <p id="github-app-id-help" className="text-sm text-muted-foreground">{t("rest.gitHubConnectionRecovery.copy")}{" "}<strong>{t("rest.gitHubConnectionRecovery.appId")}</strong>{" "}{t("rest.gitHubConnectionRecovery.fromTheAppsSettingsPage")}{" "}{reconnect && t("rest.gitHubConnectionRecovery.theSavedIdIsFilled")}</p>
        <Input id="github-app-id" aria-describedby="github-app-id-help" inputMode="numeric" value={credentials.appId} disabled={pending} aria-invalid={appIdInvalid} onChange={event => setCredentials({ ...credentials, appId: event.target.value })} />
        {appIdInvalid && <p role="alert" className="text-sm text-destructive">{t("rest.gitHubConnectionRecovery.useTheNumericAppId")}</p>}
      </div>
      <div className="space-y-2">
        <CredentialLabel id="github-private-key" label={t("rest.gitHubConnectionRecovery.privateKey")} help="Upload the .pem file downloaded from this GitHub App, or paste its entire contents, including the BEGIN and END lines." />
        <ol id="github-private-key-help" className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>{t("rest.gitHubConnectionRecovery.inTheSameAppsSettings")}{" "}<strong>{t("rest.gitHubConnectionRecovery.credentialsKeyPairsNewKey")}</strong>{t("rest.gitHubConnectionRecovery.onTheOlderSettingsPage")}{" "}<strong>{t("rest.gitHubConnectionRecovery.privateKeysGenerateAPrivate")}</strong>.</li>
          <li>{t("rest.gitHubConnectionRecovery.uploadTheDownloaded")}{" "}<strong>.pem</strong>{" "}{t("rest.gitHubConnectionRecovery.fileBelowOrPasteIts")}</li>
        </ol>
        <p className="text-sm text-muted-foreground">{t("rest.gitHubConnectionRecovery.youCanReuseAPem")}</p>
        <Input type="file" accept=".pem" aria-label={t("rest.gitHubConnectionRecovery.uploadPrivateKeyPemFile")} disabled={pending} onChange={async event => {
          const file = event.target.files?.[0];
          if (!file) return;
          setFileError("");
          try {
            const privateKey = await file.text();
            setCredentials(current => ({ ...current, privateKey }));
            setPrivateKeyDraft("");
          } catch { setFileError("Could not read this file. Try again or paste the key below."); }
        }} />
        <Input id="github-private-key" type="password" autoComplete="off" placeholder={keyLoaded ? t("rest.gitHubConnectionRecovery.pasteAReplacementPemKey") : t("rest.gitHubConnectionRecovery.orPasteTheCompletePem")} aria-describedby="github-private-key-help" disabled={pending} value={privateKeyDraft} aria-invalid={keyInvalid}
          onPaste={event => { event.preventDefault(); setCredentials({ ...credentials, privateKey: event.clipboardData.getData("text") }); setPrivateKeyDraft(""); setFileError(""); }}
          onChange={event => { setPrivateKeyDraft(event.target.value); setCredentials({ ...credentials, privateKey: event.target.value }); }} />
        {keyLoaded && <p role="status" className="text-sm">{t("rest.gitHubConnectionRecovery.privateKeyLoadedPasteOr")}</p>}
        {keyInvalid && <p role="alert" className="text-sm text-destructive">{t("rest.gitHubConnectionRecovery.useAPemPrivateKey")}</p>}
        {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
        <a className="inline-flex items-center gap-1 text-sm underline" href="https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps" target="_blank" rel="noreferrer">{t("rest.gitHubConnectionRecovery.gitHubsPrivateKeyInstructions")}<ExternalLink className="size-3.5" /></a>
      </div>
      {needsWebhookSecret && <div className="space-y-2">
        <CredentialLabel id="github-webhook-secret" label={t("rest.gitHubConnectionRecovery.webhookSecret")} help="The secret configured for this App’s webhook. It must match GitHub exactly." />
        <p className="text-sm text-muted-foreground">{t("rest.gitHubConnectionRecovery.useTheSecretSavedWhen")}</p>
        <Input id="github-webhook-secret" type="password" autoComplete="off" disabled={pending} value={credentials.webhookSecret} onChange={event => setCredentials({ ...credentials, webhookSecret: event.target.value })} />
      </div>}
    </div>}
    <SetupWizardFooter onSaveExit={onExit} disabled={pending}>
      <Button aria-label={actionLabel} disabled={pending || incomplete} onClick={() => void connect()}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        <span className="sm:hidden" aria-hidden="true">{pending ? t("rest.gitHubConnectionRecovery.checking") : reconnect ? t("rest.gitHubConnectionRecovery.reconnect") : t("rest.gitHubConnectionRecovery.connect")}</span>
        <span className="hidden sm:inline" aria-hidden="true">{actionLabel}</span>
      </Button>
    </SetupWizardFooter>
  </div>;
}
