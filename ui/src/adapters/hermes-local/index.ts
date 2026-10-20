import type { UIAdapterModule } from "../types";
import { parseHermesStdoutLine, buildHermesConfig } from "@paperclipai/hermes-paperclip-adapter/ui";
import { SchemaConfigFields } from "../schema-config-fields";
import { i18n } from "@/i18n";

export const hermesLocalUIAdapter: UIAdapterModule = {
  type: "hermes_local",
  get label() {
    return i18n.t("agents.index.hermes");
  },
  parseStdoutLine: parseHermesStdoutLine,
  ConfigFields: SchemaConfigFields,
  buildAdapterConfig: buildHermesConfig,
};
