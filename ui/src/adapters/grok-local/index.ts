import type { UIAdapterModule } from "../types";
import { createGrokStdoutParser, parseGrokStdoutLine } from "@paperclipai/adapter-grok-local/ui";
import { buildGrokLocalConfig } from "@paperclipai/adapter-grok-local/ui";
import { GrokLocalConfigFields } from "./config-fields";
import { i18n } from "@/i18n";

export const grokLocalUIAdapter: UIAdapterModule = {
  type: "grok_local",
  get label() {
    return i18n.t("agents.index.grokBuild");
  },
  parseStdoutLine: parseGrokStdoutLine,
  createStdoutParser: createGrokStdoutParser,
  ConfigFields: GrokLocalConfigFields,
  buildAdapterConfig: buildGrokLocalConfig,
};
