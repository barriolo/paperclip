import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { brandChipBadge, type BrandChipColor } from "@/lib/status-colors";
import { i18n } from "@/i18n";

/**
 * The load-bearing visual grammar for the built-in bundle status panel
 * (Reflection Coach — [PAP-13099], ux-spec §4). Each variant double-encodes
 * state as glyph + word + color so it never relies on color alone
 * (WCAG 1.4.1). Colors route through the shared `brandChipBadge` families — no
 * bespoke tints are minted here (ux-spec §10).
 *
 * A single resource shows at most one readiness chip and at most one drift
 * chip; when both a readiness problem and a drift state coexist, the caller
 * suppresses the drift chip until readiness is `ready` (ux-spec §4).
 */
export type ResourceStatusVariant =
  | "ready"
  | "needs_setup"
  | "missing"
  | "error"
  | "update_available"
  | "drifted"
  | "schedule_off"
  | "schedule_on"
  | "pending_approval"
  | "proposal_pending";

interface VariantSpec {
  color: BrandChipColor;
  glyph: string;
  label: string;
  title: string;
}

const VARIANTS: Record<ResourceStatusVariant, VariantSpec> = {
  ready: { color: "green", glyph: "●", get label() {
    return i18n.t("rest.resourceStatusChip.ready");
  }, get title() {
    return i18n.t("rest.resourceStatusChip.materializedAndMatchesTheShipped");
  } },
  needs_setup: { color: "amber", glyph: "⚠", get label() {
    return i18n.t("rest.resourceStatusChip.needsSetup");
  }, get title() {
    return i18n.t("rest.resourceStatusChip.presentButNotUsableYet");
  } },
  missing: { color: "amber", glyph: "⚠", get label() {
    return i18n.t("rest.resourceStatusChip.missing");
  }, get title() {
    return i18n.t("rest.resourceStatusChip.expectedResourceAbsentReconcileWill");
  } },
  error: { color: "red", glyph: "✕", get label() {
    return i18n.t("rest.resourceStatusChip.error");
  }, get title() {
    return i18n.t("rest.resourceStatusChip.failedToLoadOrReconcile");
  } },
  update_available: {
    color: "blue",
    glyph: "↑",
    get label() {
    return i18n.t("rest.resourceStatusChip.updateAvailable");
  },
    get title() {
    return i18n.t("rest.resourceStatusChip.uneditedANewerShippedDefault");
  },
  },
  drifted: {
    color: "gray",
    glyph: "✎",
    get label() {
    return i18n.t("rest.resourceStatusChip.drifted");
  },
    get title() {
    return i18n.t("rest.resourceStatusChip.youveEditedThisYourChanges");
  },
  },
  schedule_off: {
    color: "gray",
    glyph: "◌",
    get label() {
    return i18n.t("rest.resourceStatusChip.scheduleOff");
  },
    get title() {
    return i18n.t("rest.resourceStatusChip.noBackgroundWorkRunsUntil");
  },
  },
  schedule_on: { color: "green", glyph: "●", get label() {
    return i18n.t("rest.resourceStatusChip.weekly");
  }, get title() {
    return i18n.t("rest.resourceStatusChip.runsOnTheWeeklySchedule");
  } },
  pending_approval: {
    color: "amber",
    glyph: "⚠",
    get label() {
    return i18n.t("rest.resourceStatusChip.pendingApproval");
  },
    get title() {
    return i18n.t("rest.resourceStatusChip.waitingOnBoardHireApproval");
  },
  },
  proposal_pending: {
    color: "blue",
    glyph: "↑",
    get label() {
    return i18n.t("rest.resourceStatusChip.proposalPending");
  },
    get title() {
    return i18n.t("rest.resourceStatusChip.aProposedUpdateIsWaiting");
  },
  },
};

export function ResourceStatusChip({
  variant,
  label,
  compact = false,
  className,
}: {
  variant: ResourceStatusVariant;
  /** Override the default label (e.g. "Weekly · Mon 09:00 UTC"). */
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const spec = VARIANTS[variant];
  return (
    <Badge
      variant="outline"
      className={cn(
        brandChipBadge[spec.color],
        "font-medium",
        compact && "px-1.5 py-0 text-(length:--text-nano)",
        className,
      )}
      title={spec.title}
    >
      <span aria-hidden="true">{spec.glyph}</span>
      {label ?? spec.label}
    </Badge>
  );
}
