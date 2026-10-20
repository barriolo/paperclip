import { Mic, MicOff, Phone, PhoneOff, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { i18n, useTranslation } from "@/i18n";

export const VOICE_CONTROL_STATES = ["idle", "connecting", "listening", "speaking", "working", "interrupted", "reconnecting", "ending", "ended", "failed", "cleanup_failed"] as const;
export type VoiceControlState = typeof VOICE_CONTROL_STATES[number];
const labels: Record<VoiceControlState, string> = {
  get idle() {
    return i18n.t("rest.voiceControls.readyToTalk");
  }, get connecting() {
    return i18n.t("rest.voiceControls.connecting");
  }, get listening() {
    return i18n.t("rest.voiceControls.listening");
  }, get speaking() {
    return i18n.t("rest.voiceControls.speaking");
  },
  get working() {
    return i18n.t("rest.voiceControls.workingOnYourTask");
  }, get interrupted() {
    return i18n.t("rest.voiceControls.listeningToYourFollowup");
  }, get reconnecting() {
    return i18n.t("rest.voiceControls.reconnecting");
  },
  get ending() {
    return i18n.t("rest.voiceControls.endingCall");
  }, get ended() {
    return i18n.t("rest.voiceControls.callEnded");
  }, get failed() {
    return i18n.t("rest.voiceControls.voiceConnectionUnavailable");
  }, get cleanup_failed() {
    return i18n.t("rest.voiceControls.callClosureUnconfirmed");
  },
};
export interface VoiceControlsProps {
  state: VoiceControlState;
  agentName: string;
  muted?: boolean;
  busy?: boolean;
  playbackBlocked?: boolean;
  canRepeat?: boolean;
  onRepeat?: () => void;
  error?: string;
  announcement?: string;
  onStart: () => void;
  onMute: () => void;
  onEnd: () => void;
  onResumeAudio: () => void;
  className?: string;
}
export function VoiceControls({ state, agentName, muted = false, busy = false, playbackBlocked = false, canRepeat = false, onRepeat, error, announcement, onStart, onMute, onEnd, onResumeAudio, className }: VoiceControlsProps) {
  const { t } = useTranslation();
  const inactive = state === "idle" || state === "ended" || state === "failed";
  const connecting = state === "connecting" || state === "reconnecting";
  const startButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!inactive || !restoreFocus.current) return;
    restoreFocus.current = false;
    if (document.activeElement === document.body) startButton.current?.focus();
  }, [inactive]);
  return (
    <section aria-label={t("rest.voiceControls.voiceConversationWith", { agentName: agentName })} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="break-words text-sm font-medium">{t("rest.voiceControls.talkTo", { agentName: agentName })}</h3>
        <p role="status" className="text-sm text-muted-foreground">{labels[state]}{muted && !inactive ? t("rest.voiceControls.microphoneMuted") : ""}</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {inactive ? (
          <Button ref={startButton} size="sm" disabled={busy} onClick={onStart}><Phone aria-hidden="true" />{state === "failed" ? t("rest.voiceControls.tryAgain") : t("rest.voiceControls.startVoice")}</Button>
        ) : (
          <>
            <Button size="sm" variant="outline" aria-pressed={muted} disabled={busy || connecting || state === "ending" || state === "cleanup_failed"} onClick={onMute}>
              {muted ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}{muted ? t("rest.voiceControls.unmute") : t("rest.voiceControls.mute")}
            </Button>
            <Button size="sm" variant="outline" disabled={state === "ending"} onClick={() => { restoreFocus.current = true; onEnd(); }}><PhoneOff aria-hidden="true" />{state === "cleanup_failed" ? t("rest.voiceControls.retryEndingCall") : t("rest.voiceControls.endCall")}</Button>
          </>
        )}
        {canRepeat && onRepeat && !inactive && <Button size="sm" variant="outline" disabled={busy || connecting || state === "ending" || state === "cleanup_failed"} onClick={onRepeat}><RotateCcw aria-hidden="true" />{t("rest.voiceControls.repeatAnswer")}</Button>}
        {playbackBlocked && !inactive && <Button size="sm" variant="outline" onClick={onResumeAudio}><Volume2 aria-hidden="true" />{t("rest.voiceControls.enableAudio")}</Button>}
      </div>
      {!inactive && <p className="text-xs text-muted-foreground">{t("rest.voiceControls.endingTheCallKeepsYour")}</p>}
      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
