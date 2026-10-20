import type { UIAdapterModule } from "../types";
import { parseClaudeStdoutLine } from "@paperclipai/adapter-claude-local/ui";
import { ClaudeLocalConfigFields } from "./config-fields";
import { buildClaudeLocalConfig } from "@paperclipai/adapter-claude-local/ui";
import { i18n } from "@/i18n";

export const claudeLocalUIAdapter: UIAdapterModule = {
  type: "claude_local",
  get label() {
    return i18n.t("agents.index.claudeCode");
  },
  parseStdoutLine: parseClaudeStdoutLine,
  ConfigFields: ClaudeLocalConfigFields,
  buildAdapterConfig: buildClaudeLocalConfig,
};
