import type { UIAdapterModule } from "../types";
import { parseCodexStdoutLine } from "@paperclipai/adapter-codex-local/ui";
import { CodexLocalConfigFields, buildCodexRunnerConfig } from "./config-fields";
import { i18n } from "@/i18n";

export const codexLocalUIAdapter: UIAdapterModule = {
  type: "codex_local",
  get label() {
    return i18n.t("agents.index.codex");
  },
  parseStdoutLine: parseCodexStdoutLine,
  ConfigFields: CodexLocalConfigFields,
  buildAdapterConfig: buildCodexRunnerConfig,
};
