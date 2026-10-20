import {
  CircleCheck,
  CircleAlert,
  Loader2,
  Play,
  ChevronRight,
} from "lucide-react";
import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation, i18n } from "@/i18n";
export type TestState = "idle" | "running" | "pass" | "fail";

const copy = {
  idle: {
    get title() {
    return i18n.t("agents.runtimeTestCard.testYourAgent");
  },
    get description() {
    return i18n.t("agents.runtimeTestCard.checkThatYourRuntimeAnd");
  },
    get action() {
    return i18n.t("agents.runtimeTestCard.runTest");
  },
  },
  running: {
    get title() {
    return i18n.t("agents.runtimeTestCard.testingConnection");
  },
    get description() {
    return i18n.t("agents.runtimeTestCard.checkingTheRuntimeAndWaiting");
  },
    get action() {
    return i18n.t("agents.runtimeTestCard.testing");
  },
  },
  pass: {
    get title() {
    return i18n.t("agents.runtimeTestCard.connectionSuccessful");
  },
    get description() {
    return i18n.t("agents.runtimeTestCard.yourRuntimeChecksPassedReview");
  },
    get action() {
    return i18n.t("agents.runtimeTestCard.testAgain");
  },
  },
  warn: {
    get title() {
    return i18n.t("agents.runtimeTestCard.connectionNeedsAttention");
  },
    get description() {
    return i18n.t("agents.runtimeTestCard.reviewTheTestDetailsBefore");
  },
    get action() {
    return i18n.t("agents.runtimeTestCard.testAgain");
  },
  },
  fail: {
    get title() {
    return i18n.t("agents.runtimeTestCard.couldntConnect");
  },
    get description() {
    return i18n.t("agents.runtimeTestCard.checkYourModelAndProvider");
  },
    get action() {
    return i18n.t("agents.runtimeTestCard.retryTest");
  },
  },
} as const;

const prerequisiteCopy = {
  idle: { get title() {
    return i18n.t("agents.runtimeTestCard.checkPrerequisites");
  }, get description() {
    return i18n.t("agents.runtimeTestCard.checkInstanceSettingsAndPublic");
  }, get action() {
    return i18n.t("agents.runtimeTestCard.checkSetup");
  } },
  running: { get title() {
    return i18n.t("agents.runtimeTestCard.checkingPrerequisites");
  }, get description() {
    return i18n.t("agents.runtimeTestCard.checkingInstanceSettingsAndPublic");
  }, get action() {
    return i18n.t("agents.runtimeTestCard.checking");
  } },
  pass: { get title() {
    return i18n.t("agents.runtimeTestCard.setupChecksPassed");
  }, get description() {
    return i18n.t("agents.runtimeTestCard.reviewTheSetupDetailsBefore");
  }, get action() {
    return i18n.t("agents.runtimeTestCard.checkAgain");
  } },
  warn: { get title() {
    return i18n.t("agents.runtimeTestCard.pairingRequired");
  }, get description() {
    return i18n.t("agents.runtimeTestCard.createThisAgentThenPair");
  }, get action() {
    return i18n.t("agents.runtimeTestCard.checkAgain");
  } },
  fail: { get title() {
    return i18n.t("agents.runtimeTestCard.prerequisiteCheckFailed");
  }, get description() {
    return i18n.t("agents.runtimeTestCard.reviewTheSetupDetailsAnd");
  }, get action() {
    return i18n.t("agents.runtimeTestCard.retryCheck");
  } },
} as const;

export function RuntimeTestCard({
  state,
  result,
  error,
  onTest,
  disabled = false,
  variant = "connection",
}: {
  state: TestState | "warn";
  result: AdapterEnvironmentTestResult | null;
  error?: string | null;
  onTest: () => void;
  disabled?: boolean;
  variant?: "connection" | "prerequisites";
}) {
  const { t } = useTranslation();
  const missingRuntime = state === "fail"
    ? result?.checks.find(check => check.code === "acpx_runtime_package_missing")
    : undefined;
  const content = missingRuntime
    ? { ...copy.fail, title: "Runtime missing", description: missingRuntime.message }
    : (variant === "prerequisites" ? prerequisiteCopy : copy)[state];
  const Icon =
    state === "running"
      ? Loader2
      : state === "pass"
        ? CircleCheck
        : state === "fail" || state === "warn"
          ? CircleAlert
          : Play;
  return (
    <section
      aria-label={t("agents.runtimeTestCard.runtimeTest")}
      className="rounded-lg border border-border bg-card"
    >
      <div className="flex items-start gap-3 p-4 sm:items-center">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted",
            state === "pass"
              ? "text-green-600 dark:text-green-400"
              : state === "fail"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          <Icon
            className={cn(
              "size-4",
              state === "running" && "animate-spin motion-reduce:animate-none",
            )}
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role={state === "fail" ? "alert" : "status"}
            aria-atomic="true"
            className="min-w-0 space-y-1"
          >
            <h3 className="text-sm font-medium">{content.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {state === "fail" && error ? error : content.description}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start sm:self-center"
            disabled={disabled || state === "running"}
            onClick={onTest}
          >
            {content.action}
          </Button>
        </div>
      </div>
      {result && result.checks.length > 0 && (
        <details
          key={`${state}:${result.testedAt}`}
          className="group border-t border-border"
        >
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronRight
              aria-hidden="true"
              className="size-3 transition-transform group-open:rotate-90"
            />
            {t("agents.runtimeTestCard.testDetails")}
          </summary>
          <ul className="space-y-3 px-4 pb-4">
            {result.checks.map((check) => (
              <li
                key={check.code}
                className="flex gap-2 text-xs leading-relaxed"
              >
                {check.level === "error" || check.level === "warn" ? (
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-destructive"
                  />
                ) : (
                  <CircleCheck
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                  />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-foreground">{check.message}</p>
                  {check.detail && (
                    <p className="break-all text-muted-foreground">
                      {check.detail}
                    </p>
                  )}
                  {check.hint && (
                    <p className="text-muted-foreground">{check.hint}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
