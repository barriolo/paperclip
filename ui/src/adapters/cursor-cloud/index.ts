import type { UIAdapterModule } from "../types";
import { SchemaConfigFields } from "../schema-config-fields";
import {
  buildCursorCloudConfig,
  parseCursorCloudStdoutLine,
} from "@paperclipai/adapter-cursor-cloud/ui";
import { i18n } from "@/i18n";

export const cursorCloudUIAdapter: UIAdapterModule = {
  type: "cursor_cloud",
  get label() {
    return i18n.t("agents.index.cursorCloud");
  },
  parseStdoutLine: parseCursorCloudStdoutLine,
  ConfigFields: SchemaConfigFields,
  buildAdapterConfig: buildCursorCloudConfig,
};
