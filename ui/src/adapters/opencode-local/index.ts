import type { UIAdapterModule } from "../types";
import { parseOpenCodeStdoutLine } from "@paperclipai/adapter-opencode-local/ui";
import { OpenCodeLocalConfigFields } from "./config-fields";
import { buildOpenCodeLocalConfig } from "@paperclipai/adapter-opencode-local/ui";
import { i18n } from "@/i18n";

export const openCodeLocalUIAdapter: UIAdapterModule = {
  type: "opencode_local",
  get label() {
    return i18n.t("agents.index.openCode");
  },
  parseStdoutLine: parseOpenCodeStdoutLine,
  ConfigFields: OpenCodeLocalConfigFields,
  buildAdapterConfig: buildOpenCodeLocalConfig,
};
