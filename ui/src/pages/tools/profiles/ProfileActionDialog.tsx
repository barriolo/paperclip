import { AlertTriangle } from "lucide-react";
import type { ToolProfileWithDetails } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n";

export type ProfileActionDialogKind = "archive" | "delete" | "restore";

export function ProfileActionDialog({
  kind,
  profile,
  pending,
  onClose,
  onArchive,
  onRestore,
  onDelete,
}: {
  kind: ProfileActionDialogKind | null;
  profile: ToolProfileWithDetails | null;
  pending: boolean;
  onClose: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  if (!kind || !profile) return null;

  const defaultDeleteBlocked = kind === "delete" && profile.summary.isCompanyDefault;
  const copy = {
    archive: {
      title: t("settings.profileActionDialog.archiveProfile"),
      body: t("settings.profileActionDialog.thisProfileStopsApplyingTo", { count: profile.summary.appliesToAgentCount, appliesToAgentCount: profile.summary.appliesToAgentCount }),
      confirm: "Archive",
      action: onArchive,
    },
    restore: {
      title: t("settings.profileActionDialog.restoreProfile"),
      body: t("settings.profileActionDialog.thisProfileWillBeActive"),
      confirm: "Restore",
      action: onRestore,
    },
    delete: {
      title: t("settings.profileActionDialog.deleteProfile"),
      body: defaultDeleteBlocked
        ? t("settings.profileActionDialog.thisProfileIsTheOrganization")
        : t("settings.profileActionDialog.thisPermanentlyDeletesTheProfile", { count: profile.summary.assignmentCount, assignmentCount: profile.summary.assignmentCount }),
      confirm: "Delete",
      action: onDelete,
    },
  }[kind];

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {defaultDeleteBlocked ? (
          <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("settings.profileActionDialog.chooseAnotherAccessProfileAnd")}</span>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("settings.profileActionDialog.cancel")}</Button>
          <Button
            variant={kind === "delete" ? "destructive" : "default"}
            disabled={pending || defaultDeleteBlocked}
            onClick={copy.action}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
