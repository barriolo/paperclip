import { Inbox, ShieldCheck } from "lucide-react";
import { i18n } from "@/i18n";

export const APP_TABS = [
  { key: "permissions", get label() {
    return i18n.t("rest.appTabs.permissions");
  }, icon: ShieldCheck },
  { key: "review", get label() {
    return i18n.t("rest.appTabs.review");
  }, icon: Inbox },
] as const;

export type AppTabKey = (typeof APP_TABS)[number]["key"];

export function appTabHref(connectionId: string, tab: AppTabKey): string {
  return `/apps/${connectionId}/${tab}`;
}

export function appApplicationTabHref(applicationId: string, tab: AppTabKey): string {
  return `/apps/app/${applicationId}/${tab}`;
}

export function isAppTabKey(value: string | undefined): value is AppTabKey {
  return APP_TABS.some((tab) => tab.key === value);
}

export function appTabLabel(tabKey: AppTabKey): string {
  return APP_TABS.find((tab) => tab.key === tabKey)?.label ?? "Permissions";
}
