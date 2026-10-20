import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { i18n, useTranslation } from "@/i18n";

interface ShortcutEntry {
  keys: string[];
  label: string;
  /** Render keys as a simultaneous chord (joined with "+") rather than a
   *  "then" sequence. */
  combo?: boolean;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const sections: ShortcutSection[] = [
  {
    title: "Inbox",
    shortcuts: [
      { keys: ["j"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveDown");
  } },
      { keys: ["↓"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveDown");
  } },
      { keys: ["k"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveUp");
  } },
      { keys: ["↑"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveUp");
  } },
      { keys: ["←"], label: "Collapse selected group" },
      { keys: ["→"], label: "Expand selected group" },
      { keys: ["Enter"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.openSelectedItem");
  } },
      { keys: ["a"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.archiveItem");
  } },
      { keys: ["y"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.archiveItem");
  } },
      { keys: ["r"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.markAsRead");
  } },
      { keys: ["U"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.markAsUnread");
  } },
    ],
  },
  {
    title: "Task detail",
    shortcuts: [
      { keys: ["y"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.quickarchiveBackToInbox");
  } },
      { keys: ["g", "i"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.goToInbox");
  } },
      { keys: ["g", "c"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.focusCommentComposer");
  } },
    ],
  },
  {
    title: "Decisions",
    shortcuts: [
      { keys: ["j"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveDown");
  } },
      { keys: ["↓"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveDown");
  } },
      { keys: ["k"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveUp");
  } },
      { keys: ["↑"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.moveUp");
  } },
      { keys: ["Enter"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.openOrCloseSelectedDecision");
  } },
      { keys: ["x"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.dismissSelectedDecision");
  } },
    ],
  },
  {
    title: "Global",
    shortcuts: [
      { keys: ["/"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.searchCurrentPageOrQuick");
  } },
      { keys: ["c"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.newTask");
  } },
      { keys: ["["], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.toggleSidebar");
  } },
      { keys: ["]"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.togglePanel");
  } },
      { keys: ["?"], get label() {
    return i18n.t("rest.keyboardShortcutsCheatsheet.showKeyboardShortcuts");
  } },
    ],
  },
];

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-(--shadow-extract-10)">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsCheatsheetContent() {
  const { t } = useTranslation();
  return (
    <>
      <div className="divide-y divide-border border-t border-border">
        {sections.map((section) => (
          <div key={section.title} className="px-5 py-3">
            <h3 className="mb-2 text-(length:--text-micro) font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
            <div className="space-y-1.5">
              {section.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label + shortcut.keys.join()}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-foreground/90">{shortcut.label}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {shortcut.combo ? "+" : "then"}
                          </span>
                        )}
                        <KeyCap>{key}</KeyCap>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {t("rest.keyboardShortcutsCheatsheet.press")}{" "}<KeyCap>{t("rest.keyboardShortcutsCheatsheet.esc")}</KeyCap>{" "}{t("rest.keyboardShortcutsCheatsheet.toCloseShortcutsAreDisabled")}
        </p>
      </div>
    </>
  );
}

export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">{t("rest.keyboardShortcutsCheatsheet.keyboardShortcuts")}</DialogTitle>
        </DialogHeader>
        <KeyboardShortcutsCheatsheetContent />
      </DialogContent>
    </Dialog>
  );
}
