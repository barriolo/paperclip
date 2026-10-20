import { i18n } from "@/i18n";
/**
 * Prosumer copy for the Apps surface (PAP-10856).
 *
 * The P1a gallery manifest carries developer-flavoured taglines and credential
 * labels (e.g. "Connect Zapier-hosted MCP actions", "Zapier MCP token"). Those
 * strings would fail the vocabulary gate from PAP-10827 — no "MCP", "server",
 * "profile", "policy", "gateway", or "transport" anywhere on this surface. So
 * the UI never renders the raw manifest copy directly: it looks up plain copy
 * here, and `sanitizeProsumerCopy` is a final backstop for any free-text we do
 * surface (app names, fallback taglines).
 */

/** Words that must never appear in prosumer-facing copy on the Apps surface. */
const BANNED_WORDS = [
  "mcp",
  "server",
  "profile",
  "policy",
  "gateway",
  "transport",
  "stdio",
  "endpoint",
];

const BANNED_RE = new RegExp(`\\b(${BANNED_WORDS.join("|")})s?\\b`, "gi");

/**
 * Strip banned vocabulary from a free-text string as a last-resort backstop.
 * Prefer curated copy below; this only protects against manifest text we can't
 * fully control (e.g. a newly added gallery app with no curated entry yet).
 */
export function sanitizeProsumerCopy(text: string): string {
  return text
    .replace(BANNED_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .trim();
}

export interface AppCopy {
  /** Two short lines for the gallery card (M2). */
  tagline: string;
  /** Single line for the connect step header (M3b). */
  short: string;
}

/**
 * Curated prosumer copy keyed by gallery key. Taken from the M-series wires
 * (https://happy-grove-jzyc.here.now/). Apps without an entry fall back to a
 * generic, gate-safe line.
 */
const APP_COPY: Record<string, AppCopy> = {
  zapier: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.reach9000AppsYourTeam");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.reach9000AppsFromYour");
  },
  },
  github: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readCodeAndPullRequests");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readCodeAndPullRequests");
  },
  },
  slack: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.sendAndReadMessagesIn");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.sendAndReadMessagesIn2");
  },
  },
  notion: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readAndUpdatePagesIn");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readAndUpdatePagesIn");
  },
  },
  railway: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.inspectServicesReadLogsAnd");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.connectRailwayForDeploymentsLogs");
  },
  },
  posthog: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.exploreProductUsageErrorsFlags");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.signInWithPosthogProject");
  },
  },
  gauge: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.trackYourBrandInAi");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.signInWithGaugeAnd");
  },
  },
  neon: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.managePostgresProjectsBranchesAnd");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.signInWithNeonProject");
  },
  },
  superagent: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.reviewSecurityFindingsAndRun");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.connectWithASuperagentApi");
  },
  },
  linear: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.createUpdateAndReadTickets");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.createUpdateAndReadTickets");
  },
  },
  "google-sheets": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readAndUpdateSelectedSpreadsheets");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readSpreadsheetsOrUpdateThe");
  },
  },
  gmail: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readMailAndCreateDrafts");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readMailAndCreateDrafts");
  },
  },
  "google-drive": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.findReadAndCreateFiles");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.findReadAndCreateFiles");
  },
  },
  "google-docs": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readAndUpdateDocuments");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readAndUpdateDocuments");
  },
  },
  "google-slides": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readAndUpdatePresentations");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readAndUpdatePresentations");
  },
  },
  "google-calendar": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.reviewCalendarsAndManageEvents");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.reviewCalendarsAndManageEvents");
  },
  },
  "google-chat": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readConversationsAndSendMessages");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readConversationsAndSendMessages");
  },
  },
  "google-people": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.lookUpContactsAndPeople");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.lookUpContactsAndPeople");
  },
  },
  "google-workspace-search": {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.searchAcrossYourGoogleWorkspace");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.searchAcrossYourGoogleWorkspace");
  },
  },
  hubspot: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.lookUpContactsAndUpdate");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.lookUpContactsAndUpdate");
  },
  },
  intercom: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readAndReplyToCustomer");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readAndReplyToCustomer");
  },
  },
  figma: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readFilesAndPostComments");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readFilesAndPostComments");
  },
  },
  stripe: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.readCustomersInvoicesAndPayouts");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.readCustomersInvoicesAndPayouts");
  },
  },
  context7: {
    get tagline() {
    return i18n.t("rest.appGalleryCopy.lookUpUptodateDocsFor");
  },
    get short() {
    return i18n.t("rest.appGalleryCopy.lookUpUptodateDocsFor");
  },
  },
};

const GENERIC: AppCopy = {
  tagline: "Give your agents access to this app.",
  short: "Give your agents access to this app.",
};

/** Curated, gate-safe copy for a gallery app. */
export function appCopyFor(key: string, fallbackTagline?: string | null): AppCopy {
  const curated = APP_COPY[key];
  if (curated) return curated;
  if (fallbackTagline) {
    const cleaned = sanitizeProsumerCopy(fallbackTagline);
    if (cleaned) return { tagline: cleaned, short: cleaned };
  }
  return GENERIC;
}

/**
 * Label for a single credential field on the key-paste step (M3b). The raw
 * manifest label can contain banned vocab ("Zapier MCP token"), so for the
 * common single-field case we present "Your {App} key" per the wires; multi-
 * field apps fall back to a sanitized version of the manifest label.
 */
export function credentialFieldLabel(
  appName: string,
  rawLabel: string,
  fieldCount: number,
): string {
  if (fieldCount <= 1) return i18n.t("rest.appGalleryCopy.yourKey", { appName: appName });
  const cleaned = sanitizeProsumerCopy(rawLabel);
  return cleaned || `Your ${appName} key`;
}
