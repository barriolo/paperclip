/**
 * Single source of truth for adapter display metadata.
 *
 * Built-in adapters have entries in `adapterDisplayMap`. External (plugin)
 * adapters get sensible defaults derived from their type string via
 * `getAdapterDisplay()`.
 */
import type { ComponentType } from "react";
import { agentHarnessType } from "@paperclipai/shared";
import {
  Bot,
  Code,
  Gem,
  Moon,
  MousePointer2,
  Sparkles,
  Terminal,
  Cpu,
} from "lucide-react";
import { OpenCodeLogoIcon } from "@/components/OpenCodeLogoIcon";
import { i18n } from "@/i18n";

// ---------------------------------------------------------------------------
// Type suffix parsing
// ---------------------------------------------------------------------------

// Suffixes stripped from type ids when deriving a human-readable label for
// unknown (plugin) adapter types. "_local" is a legacy qualifier from before
// first-class Environments and is never displayed; "_gateway" is re-appended
// as " (gateway)" to disambiguate gateway variants. Known adapters in
// `adapterDisplayMap` have final labels and never get a derived suffix.
const STRIPPED_TYPE_SUFFIXES = ["_local", "_gateway"] as const;

const DISPLAY_SUFFIXES: Record<string, string> = {
  _gateway: "gateway",
};

function getTypeSuffix(type: string): string | null {
  for (const [suffix, mode] of Object.entries(DISPLAY_SUFFIXES)) {
    if (type.endsWith(suffix)) return mode;
  }
  return null;
}

function withSuffix(label: string, suffix: string | null): string {
  return suffix ? `${label} (${suffix})` : label;
}

// ---------------------------------------------------------------------------
// Display metadata per adapter type
// ---------------------------------------------------------------------------

export interface AdapterDisplayInfo {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  recommended?: boolean;
  comingSoon?: boolean;
  disabledLabel?: string;
  experimental?: boolean;
  hideFromVisualSelection?: boolean;
}

const adapterDisplayMap: Record<string, AdapterDisplayInfo> = {
  acpx_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.aCPXRetired");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.retiredStandaloneAcpxAdapter");
  },
    icon: Bot,
    comingSoon: true,
    disabledLabel: "Use Claude Code or Codex with the ACP engine",
    hideFromVisualSelection: true,
  },
  claude_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.claudeCode");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.claudeCodeCliHarness");
  },
    icon: Sparkles,
    recommended: true,
  },
  codex_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.codex");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.codexCliHarness");
  },
    icon: Code,
    recommended: true,
  },
  paperclip_runner: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.paperclipRunner");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.experimentalRustRunnerWithA");
  },
    icon: Cpu,
    experimental: true,
  },
  gemini_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.geminiCli");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.geminiCliHarness");
  },
    icon: Gem,
  },
  grok_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.grokBuild");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.grokBuildHarness");
  },
    icon: Bot,
  },
  kimi_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.kimiCode");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.kimiCodeCliHarness");
  },
    icon: Moon,
  },
  hermes_gateway: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.hermesGateway");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.remoteHermesApiServer");
  },
    icon: Bot,
    hideFromVisualSelection: true,
  },
  hermes_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.hermes");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.hermesHarness");
  },
    icon: Bot,
  },
  opencode_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.openCode");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.openCodeMultiproviderHarness");
  },
    icon: OpenCodeLogoIcon,
  },
  pi_local: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.pi");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.piHarness");
  },
    icon: Terminal,
  },
  cursor: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.cursor");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.cursorCliHarness");
  },
    icon: MousePointer2,
  },
  // Display-only choice: persisted as paperclip_runner with provider openai_dot.
  grok_bot: { get label() {
    return i18n.t("agents.adapterDisplayRegistry.grokBot");
  }, experimental: true, icon: Bot, get description() {
    return i18n.t("agents.adapterDisplayRegistry.anExistingExternalBotIn");
  } },
  openai_dot: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.openAIDot");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.yourDotInChatgpt");
  },
    icon: Bot,
    experimental: true,
  },
  muse: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.musePersonalAgent");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.yourPersonalMuseAtMuseai");
  },
    icon: Bot,
    experimental: true,
  },
  cursor_cloud: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.cursorCloud");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.managedRemoteCursorAgent");
  },
    icon: MousePointer2,
  },
  openclaw_gateway: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.openClawGateway");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.externalGatewayAdapter");
  },
    icon: Bot,
    comingSoon: true,
    disabledLabel: "Invite external agents from the add-agent modal",
    hideFromVisualSelection: true,
  },
  process: {
    get label() {
    return i18n.t("agents.adapterDisplayRegistry.process");
  },
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.internalProcessAdapter");
  },
    icon: Cpu,
    comingSoon: true,
  },
  http: {
    label: "HTTP",
    get description() {
    return i18n.t("agents.adapterDisplayRegistry.internalHttpAdapter");
  },
    icon: Cpu,
    comingSoon: true,
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function humanizeType(type: string): string {
  // Strip known type suffixes so "droid_local" → "Droid", not "Droid Local"
  let base = type;
  for (const suffix of STRIPPED_TYPE_SUFFIXES) {
    if (base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAdapterLabel(type: string): string {
  // Known labels are final — only unknown (plugin) types get a derived
  // suffix, so labels like "OpenClaw Gateway" don't become
  // "OpenClaw Gateway (gateway)".
  const known = adapterDisplayMap[type];
  if (known) return known.label;
  return withSuffix(humanizeType(type), getTypeSuffix(type));
}

export function getAdapterLabels(): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [type, info] of Object.entries(adapterDisplayMap)) {
    labels[type] = info.label;
  }
  return labels;
}

export function getAdapterDisplay(type: string): AdapterDisplayInfo {
  const known = adapterDisplayMap[type];
  if (known) return known;

  const suffix = getTypeSuffix(type);
  const label = withSuffix(humanizeType(type), suffix);
  return {
    label,
    description: suffix ? `External ${suffix} adapter` : i18n.t("agents.adapterDisplayRegistry.externalAdapter"),
    icon: Cpu,
  };
}

export function agentDisplayAdapterType(agent: { adapterType: string; adapterConfig: Record<string, unknown> }): string {
  if (agent.adapterType !== "paperclip_runner") return agent.adapterType;
  if (agent.adapterConfig.provider === "openai_dot" || agent.adapterConfig.provider === "grok_bot" || agent.adapterConfig.provider === "muse") {
    return agent.adapterConfig.provider;
  }
  const harness = agentHarnessType(agent.adapterType, agent.adapterConfig);
  return ["codex_local", "claude_local"].includes(harness) ? harness : agent.adapterType;
}

export function isKnownAdapterType(type: string): boolean {
  return type in adapterDisplayMap;
}
