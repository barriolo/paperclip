import type { UIAdapterModule } from "../types";
import { parsePiStdoutLine } from "@paperclipai/adapter-pi-local/ui";
import { PiLocalConfigFields } from "./config-fields";
import { buildPiLocalConfig } from "@paperclipai/adapter-pi-local/ui";
import { i18n } from "@/i18n";

export const piLocalUIAdapter: UIAdapterModule = {
  type: "pi_local",
  get label() {
    return i18n.t("agents.index.pi");
  },
  parseStdoutLine: parsePiStdoutLine,
  ConfigFields: PiLocalConfigFields,
  buildAdapterConfig: buildPiLocalConfig,
};
