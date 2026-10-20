import type { UIAdapterModule } from "../types";
import { parseOpenClawGatewayStdoutLine } from "@paperclipai/adapter-openclaw-gateway/ui";
import { buildOpenClawGatewayConfig } from "@paperclipai/adapter-openclaw-gateway/ui";
import { OpenClawGatewayConfigFields } from "./config-fields";
import { i18n } from "@/i18n";

export const openClawGatewayUIAdapter: UIAdapterModule = {
  type: "openclaw_gateway",
  get label() {
    return i18n.t("agents.index.openClawGateway");
  },
  parseStdoutLine: parseOpenClawGatewayStdoutLine,
  ConfigFields: OpenClawGatewayConfigFields,
  buildAdapterConfig: buildOpenClawGatewayConfig,
};
