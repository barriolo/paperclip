import type { UIAdapterModule } from "../types";
import { parseHttpStdoutLine } from "./parse-stdout";
import { HttpConfigFields } from "./config-fields";
import { buildHttpConfig } from "./build-config";
import { i18n } from "@/i18n";

export const httpUIAdapter: UIAdapterModule = {
  type: "http",
  get label() {
    return i18n.t("agents.index.hTTPWebhook");
  },
  parseStdoutLine: parseHttpStdoutLine,
  ConfigFields: HttpConfigFields,
  buildAdapterConfig: buildHttpConfig,
};
