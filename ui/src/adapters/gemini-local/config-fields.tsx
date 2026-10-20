import { configFieldsForSection } from "../config-sections";
import type { AdapterConfigFieldsProps } from "../types";
import {
  DraftNumberInput,
  DraftInput,
  Field,
} from "../../components/agent-config-primitives";
import { ChoosePathButton } from "../../components/PathInstructionsModal";
import { useTranslation } from "@/i18n";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";
const instructionsFileHint =
  "Absolute path to a markdown file (e.g. AGENTS.md) that defines this agent's behavior. Prepended to the Gemini prompt at runtime.";

export function GeminiLocalConfigFields({
  section,
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
  hideInstructionsFile,
  managedSandboxOnly,
}: AdapterConfigFieldsProps) {
  const { t } = useTranslation();
  const rawEngine = isCreate
    ? values!.geminiEngine ?? "auto"
    : eff("adapterConfig", "engine", String(config.engine ?? "auto"));
  const engine = rawEngine === "acp" || rawEngine === "cli" ? rawEngine : "auto";
  const acpSelected = engine === "acp";

  return configFieldsForSection(section, (
    <>
      {/*
        The execution engine picks which binary runs on the execution host, and
        the ACP sub-fields below name host paths. The platform-managed
        environment owns both, so the managed-sandbox-only policy hides them.
      */}
      {!managedSandboxOnly && <Field label={t("agents.configFields.executionEngine")} hint={t("agents.configFields.defaultUsesAcpIfAcp")}>
        <select
          className={inputClass}
          value={engine}
          onChange={(e) => {
            const value = e.target.value === "acp" ? "acp" : e.target.value === "cli" ? "cli" : "auto";
            isCreate
              ? set!({ geminiEngine: value })
              : mark("adapterConfig", "engine", value === "auto" ? undefined : value);
          }}
        >
          <option value="auto">{t("agents.configFields.defaultAcp")}</option>
          <option value="cli">{t("agents.configFields.geminiCli")}</option>
          <option value="acp">ACP</option>
        </select>
      </Field>}
      {acpSelected && (
        <>
          {!managedSandboxOnly && (
            <Field configSection="advanced"
              label={t("agents.configFields.aCPServerCommand")}
              hint={t("agents.configFields.optionalOverrideForTheGemini")}
            >
              <DraftInput
                value={
                  isCreate
                    ? values!.geminiAcpAgentCommand ?? ""
                    : eff("adapterConfig", "agentCommand", String(config.agentCommand ?? ""))
                }
                onCommit={(v) =>
                  isCreate
                    ? set!({ geminiAcpAgentCommand: v })
                    : mark("adapterConfig", "agentCommand", v || undefined)
                }
                immediate
                className={inputClass}
                placeholder={t("agents.configFields.geminiAcp")}
              />
            </Field>
          )}
          <Field configSection="runPolicy" label={t("agents.configFields.aCPSessionMode")} hint={t("agents.configFields.persistentKeepsAcpSessionState")}>
            <select
              className={inputClass}
              value={
                isCreate
                  ? values!.geminiAcpMode ?? "persistent"
                  : eff("adapterConfig", "mode", String(config.mode ?? "persistent"))
              }
              onChange={(e) => {
                const value = e.target.value === "oneshot" ? "oneshot" : "persistent";
                isCreate
                  ? set!({ geminiAcpMode: value })
                  : mark("adapterConfig", "mode", value);
              }}
            >
              <option value="persistent">{t("agents.configFields.persistent")}</option>
              <option value="oneshot">{t("agents.configFields.oneshot")}</option>
            </select>
          </Field>
          <Field
            label={t("agents.configFields.aCPNoninteractivePermissions")}
            hint={t("agents.configFields.fallbackIfTheAcpAgent")}
          >
            <select
              className={inputClass}
              value={
                isCreate
                  ? values!.geminiAcpNonInteractivePermissions ?? "deny"
                  : eff("adapterConfig", "nonInteractivePermissions", String(config.nonInteractivePermissions ?? "deny"))
              }
              onChange={(e) => {
                const value = e.target.value === "fail" ? "fail" : "deny";
                isCreate
                  ? set!({ geminiAcpNonInteractivePermissions: value })
                  : mark("adapterConfig", "nonInteractivePermissions", value);
              }}
            >
              <option value="deny">{t("agents.configFields.deny")}</option>
              <option value="fail">{t("agents.configFields.fail")}</option>
            </select>
          </Field>
          {!managedSandboxOnly && (
            <Field
              label={t("agents.configFields.aCPStateDirectory")}
              hint={t("agents.configFields.optionalAcpSessionStateDirectory")}
            >
              <div className="flex items-center gap-2">
                <DraftInput
                  value={
                    isCreate
                      ? values!.geminiAcpStateDir ?? ""
                      : eff("adapterConfig", "stateDir", String(config.stateDir ?? ""))
                  }
                  onCommit={(v) =>
                    isCreate
                      ? set!({ geminiAcpStateDir: v })
                      : mark("adapterConfig", "stateDir", v || undefined)
                  }
                  immediate
                  className={inputClass}
                  placeholder="/path/to/acp-state"
                />
                <ChoosePathButton />
              </div>
            </Field>
          )}
          <Field configSection="runPolicy"
            label={t("agents.configFields.aCPWarmProcessIdleMs")}
            hint={t("agents.configFields.defaultsTo0WhichCloses")}
          >
            {isCreate ? (
              <input
                type="number"
                className={inputClass}
                value={values!.geminiAcpWarmHandleIdleMs ?? 0}
                onChange={(e) => set!({ geminiAcpWarmHandleIdleMs: Number(e.target.value) })}
              />
            ) : (
              <DraftNumberInput
                value={eff(
                  "adapterConfig",
                  "warmHandleIdleMs",
                  Number(config.warmHandleIdleMs ?? 0),
                )}
                onCommit={(v) => mark("adapterConfig", "warmHandleIdleMs", v || 0)}
                immediate
                className={inputClass}
              />
            )}
          </Field>
        </>
      )}
      {!hideInstructionsFile && (
        <Field label={t("agents.configFields.agentInstructionsFile")} hint={instructionsFileHint}>
          <div className="flex items-center gap-2">
            <DraftInput
              value={
                isCreate
                  ? values!.instructionsFilePath ?? ""
                  : eff(
                      "adapterConfig",
                      "instructionsFilePath",
                      String(config.instructionsFilePath ?? ""),
                    )
              }
              onCommit={(v) =>
                isCreate
                  ? set!({ instructionsFilePath: v })
                  : mark("adapterConfig", "instructionsFilePath", v || undefined)
              }
              immediate
              className={inputClass}
              placeholder="/absolute/path/to/AGENTS.md"
            />
            <ChoosePathButton />
          </div>
        </Field>
      )}
    </>
  ));
}
