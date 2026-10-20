import type { UIAdapterModule } from "../types";
import { parseProcessStdoutLine } from "./parse-stdout";
import { ProcessConfigFields } from "./config-fields";
import { buildProcessConfig } from "./build-config";
import { i18n } from "@/i18n";

export const processUIAdapter: UIAdapterModule = {
  type: "process",
  get label() {
    return i18n.t("agents.index.shellProcess");
  },
  parseStdoutLine: parseProcessStdoutLine,
  ConfigFields: ProcessConfigFields,
  buildAdapterConfig: buildProcessConfig,
};
