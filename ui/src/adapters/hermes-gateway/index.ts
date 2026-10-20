import type { UIAdapterModule } from "../types";
import { parseStdoutLine as parseHermesGatewayStdoutLine } from "@paperclipai/hermes-paperclip-adapter/gateway/ui";
import { buildSchemaAdapterConfig } from "../schema-config-fields";
import { HermesGatewayConfigFields } from "./config-fields";
import { i18n } from "@/i18n";

export const hermesGatewayUIAdapter: UIAdapterModule = {
  type: "hermes_gateway",
  get label() {
    return i18n.t("agents.index.hermesGateway");
  },
  parseStdoutLine: parseHermesGatewayStdoutLine,
  ConfigFields: HermesGatewayConfigFields,
  buildAdapterConfig: buildSchemaAdapterConfig,
};
