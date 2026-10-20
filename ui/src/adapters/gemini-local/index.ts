import type { UIAdapterModule } from "../types";
import { parseGeminiStdoutLine } from "@paperclipai/adapter-gemini-local/ui";
import { GeminiLocalConfigFields } from "./config-fields";
import { buildGeminiLocalConfig } from "@paperclipai/adapter-gemini-local/ui";
import { i18n } from "@/i18n";

export const geminiLocalUIAdapter: UIAdapterModule = {
  type: "gemini_local",
  get label() {
    return i18n.t("agents.index.geminiCli");
  },
  parseStdoutLine: parseGeminiStdoutLine,
  ConfigFields: GeminiLocalConfigFields,
  buildAdapterConfig: buildGeminiLocalConfig,
};
