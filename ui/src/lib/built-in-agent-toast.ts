import type { ToastInput } from "@/context/ToastContext";
import { i18n } from "@/i18n";

export interface BuiltInAgentPausedToastOptions {
  /** Display name of the paused built-in agent, e.g. "Briefs Agent". */
  displayName: string;
  /** Deep link to the agent page (from `agentUrl(agent)`). */
  agentHref: string;
  /** Noun for the feature item, e.g. "brief". */
  featureNoun?: string;
}

/**
 * Build the "use-while-paused" toast payload (ux-spec §5 / D9).
 *
 * `ToastAction` supports a single `href` link only, so v1 carries one
 * "View agent" link and Resume happens on the agent page. Deduped so repeated
 * feature actions don't stack duplicate toasts.
 */
export function buildBuiltInAgentPausedToast(options: BuiltInAgentPausedToastOptions): ToastInput {
  const noun = options.featureNoun ?? "item";
  return {
    dedupeKey: `built-in-agent-paused:${options.displayName}`,
    title: i18n.t("agents.builtInAgentToast.isPaused", { displayName: options.displayName }),
    body: `Resume the agent to generate this ${noun}.`,
    tone: "warn",
    action: { label: i18n.t("agents.builtInAgentToast.viewAgent"), href: options.agentHref },
  };
}
