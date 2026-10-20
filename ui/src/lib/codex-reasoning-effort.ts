import {
  codexLocalReasoningEffortsForModel,
  type CodexLocalReasoningEffort,
} from "@paperclipai/adapter-codex-local";
import { i18n } from "@/i18n";

const CODEX_REASONING_EFFORT_LABELS: Record<CodexLocalReasoningEffort, string> = {
  get minimal() {
    return i18n.t("rest.codexReasoningEffort.minimal");
  },
  get low() {
    return i18n.t("rest.codexReasoningEffort.low");
  },
  get medium() {
    return i18n.t("rest.codexReasoningEffort.medium");
  },
  get high() {
    return i18n.t("rest.codexReasoningEffort.high");
  },
  get xhigh() {
    return i18n.t("rest.codexReasoningEffort.xHigh");
  },
  get max() {
    return i18n.t("rest.codexReasoningEffort.max");
  },
  get ultra() {
    return i18n.t("rest.codexReasoningEffort.ultra");
  },
};

export function codexReasoningEffortOptions(
  model: string | null | undefined,
  defaultLabel = "Default",
) {
  return [
    { value: "", label: defaultLabel },
    ...codexLocalReasoningEffortsForModel(model).map((value) => ({
      value,
      label: CODEX_REASONING_EFFORT_LABELS[value],
    })),
  ];
}
