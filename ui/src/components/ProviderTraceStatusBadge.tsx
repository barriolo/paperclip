import type { ProviderTraceMetadata } from "@paperclipai/shared";
import { Bug, CircleOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export function runRequestedProviderTrace(
  contextSnapshot: Record<string, unknown> | null | undefined,
) {
  if (!contextSnapshot) return false;
  const debug = contextSnapshot.debug;
  return (
    typeof debug === "object" &&
    debug !== null &&
    !Array.isArray(debug) &&
    (debug as Record<string, unknown>).providerTrace === "raw"
  );
}

export function ProviderTraceStatusBadge({
  trace,
  requested = false,
  showOff = false,
  className,
}: {
  trace?: ProviderTraceMetadata | null;
  requested?: boolean;
  showOff?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const status = trace?.status;
  const expired = trace
    ? new Date(trace.expiresAt).getTime() <= Date.now()
    : false;
  const label = expired
    ? t("rest.providerTraceStatusBadge.traceExpired")
    : status === "capturing"
      ? t("rest.providerTraceStatusBadge.rawTracingEnabled")
      : status === "complete"
        ? t("rest.providerTraceStatusBadge.traceCaptured")
        : status === "incomplete"
          ? t("rest.providerTraceStatusBadge.traceIncomplete")
          : status === "truncated"
            ? "Trace truncated"
            : status === "expired"
              ? t("rest.providerTraceStatusBadge.traceExpired")
              : status === "deleted"
                ? t("rest.providerTraceStatusBadge.traceDeleted")
                : requested
                  ? t("rest.providerTraceStatusBadge.traceRequested")
                  : showOff
                    ? t("rest.providerTraceStatusBadge.traceOff")
                    : null;
  if (!label) return null;
  const warning =
    status === "incomplete" ||
    status === "truncated" ||
    status === "expired" ||
    status === "deleted" ||
    expired;
  const Icon = label === "Trace off" ? CircleOff : Bug;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-(length:--text-micro) font-medium",
        label === "Trace off" || label === "Trace deleted" || label === "Trace expired"
          ? "border-border bg-background text-muted-foreground"
          : warning
            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        className,
      )}
      title={
        trace
          ? t("rest.providerTraceStatusBadge.framesBytesExpires", { frameCount: trace.frameCount, byteCount: trace.byteCount, localeString: new Date(trace.expiresAt).toLocaleString() })
          : requested
            ? t("rest.providerTraceStatusBadge.thisRunRequestedSensitiveProviderframe")
            : t("rest.providerTraceStatusBadge.rawProviderframeCaptureWasDisabled")
      }
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
