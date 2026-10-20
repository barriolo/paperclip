import type { UIAdapterModule } from "../types";
import { parseCursorStdoutLine } from "@paperclipai/adapter-cursor-local/ui";
import { CursorLocalConfigFields } from "./config-fields";
import { buildCursorLocalConfig } from "@paperclipai/adapter-cursor-local/ui";
import { i18n } from "@/i18n";

export const cursorLocalUIAdapter: UIAdapterModule = {
  type: "cursor",
  get label() {
    return i18n.t("agents.index.cursor");
  },
  parseStdoutLine: parseCursorStdoutLine,
  ConfigFields: CursorLocalConfigFields,
  buildAdapterConfig: buildCursorLocalConfig,
};
