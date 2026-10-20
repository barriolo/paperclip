import { Button } from "@/components/ui/button";
import { SetupWizardFooter } from "@/components/SetupWizard";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";

export interface SpekoProviderSetupProps {
  agentName: string;
  onSaveExit?(): void;
  credentials: Record<string, string>;
  onChange(values: Record<string, string>): void;
  onConnect(values: Record<string, string>): void;
  callbackUrl?: string | null;
  pending?: boolean;
  repairing?: boolean;
  /** Presence only; existing callback secrets never reach the browser. */
  signingSecretConfigured?: boolean;
}
export function SpekoProviderSetup({ agentName, onSaveExit, credentials, onChange, onConnect, callbackUrl, pending = false, repairing = false, signingSecretConfigured }: SpekoProviderSetupProps) {
  const { t } = useTranslation();
  const hasSavedSecret = signingSecretConfigured ?? repairing;
  const ready = repairing && hasSavedSecret || Boolean(credentials.apiKey?.trim() && credentials.agentId?.trim());
  const reachable = callbackUrl?.startsWith("https://") === true;
  function connect() {
    if (!ready || !reachable || pending) return;
    const values = Object.fromEntries(Object.entries(credentials).filter(([, value]) => value.trim()));
    if (!hasSavedSecret && !values.signingSecret) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      values.signingSecret = `whsec_${btoa(String.fromCharCode(...bytes))}`;
      onChange(values);
    }
    onConnect(values);
  }
  return <div className="space-y-5">
    <div>
      <h1 className="text-xl font-bold">{t("rest.spekoProviderSetup.connectToSpeko", { agentName: agentName })}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("rest.spekoProviderSetup.chooseADedicatedSpekoVoice", { agentName: agentName })}</p>
    </div>
    <ol className="list-decimal space-y-2 pl-5 text-sm">
      <li>{t("rest.spekoProviderSetup.createADedicatedAgentIn")}</li>
      <li>{t("rest.spekoProviderSetup.copyItsAgentIdAnd")}</li>
      <li>{t("rest.spekoProviderSetup.reviewRecordingAndRetentionSettings")}</li>
    </ol>
    <Button asChild variant="outline"><a href="https://platform.speko.ai/agents" target="_blank" rel="noreferrer">{t("rest.spekoProviderSetup.openSpekoAgents")}</a></Button>
    <label className="grid gap-2 text-sm font-medium">{t("rest.spekoProviderSetup.spekoAgentId")}<Input autoComplete="off" value={credentials.agentId ?? ""} placeholder={repairing ? t("rest.spekoProviderSetup.leaveBlankToKeepThe") : t("rest.spekoProviderSetup.agent")} onChange={(event) => onChange({ ...credentials, agentId: event.target.value })} /></label>
    <label className="grid gap-2 text-sm font-medium">{t("rest.spekoProviderSetup.spekoApiKey")}<Input type="password" autoComplete="new-password" value={credentials.apiKey ?? ""} placeholder={repairing ? t("rest.spekoProviderSetup.leaveBlankToKeepThe2") : t("rest.spekoProviderSetup.pasteYourSpekoApiKey")} onChange={(event) => onChange({ ...credentials, apiKey: event.target.value })} /></label>
    {!reachable && <p role="alert" className="text-sm text-destructive">{t("rest.spekoProviderSetup.configureAPublicHttpsCallback")}</p>}
    {reachable && <p className="break-all text-xs text-muted-foreground">{t("rest.spekoProviderSetup.callback", { callbackUrl: callbackUrl })}</p>}
    <p className="text-sm text-muted-foreground">{t("rest.spekoProviderSetup.credentialsAndAGeneratedCallback")}</p>
    {onSaveExit ? <SetupWizardFooter onSaveExit={onSaveExit} disabled={pending}><Button disabled={!ready || !reachable || pending} onClick={connect}>{pending ? t("rest.spekoProviderSetup.verifyingSpeko") : repairing ? t("rest.spekoProviderSetup.reconnectSpeko") : t("rest.spekoProviderSetup.connectSpeko")}</Button></SetupWizardFooter> : <div className="flex justify-end"><Button disabled={!ready || !reachable || pending} onClick={connect}>{pending ? t("rest.spekoProviderSetup.verifyingSpeko") : repairing ? t("rest.spekoProviderSetup.reconnectSpeko") : t("rest.spekoProviderSetup.connectSpeko")}</Button></div>}
  </div>;
}
