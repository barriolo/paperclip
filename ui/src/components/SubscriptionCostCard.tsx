import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SUBSCRIPTION_CURRENCIES, centsToUsd, usdToCents, type SubscriptionAccountReport, type SubscriptionCostReport, type SubscriptionUsage } from "@paperclipai/shared";
import { subscriptionsApi } from "../api/subscriptions";
import { formatCents, formatDateTime, formatTokens, providerDisplayName } from "../lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useTranslation } from "@/i18n";

export function subscriptionMoney(cents: string, currency: string) {
  return currency === "USD" ? formatCents(Number(cents))
    : new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "code" }).format(Number(cents) / 100);
}

export function SubscriptionTokenUsage({ usage }: { usage: SubscriptionUsage }) {
  const { t } = useTranslation();
  return <span className="font-mono text-xs text-muted-foreground">
    {formatTokens(usage.inputTokens + usage.cachedInputTokens)}{" "}{t("rest.subscriptionCostCard.inOut", { tokens: formatTokens(usage.outputTokens) })}
    {usage.cachedInputTokens > 0 && <span className="block">{t("rest.subscriptionCostCard.inputCached", { tokens: formatTokens(usage.cachedInputTokens) })}</span>}
  </span>;
}

function SubscriptionEditor({ account, accounts, companyId, onDone }: {
  account: SubscriptionAccountReport; accounts: SubscriptionAccountReport[]; companyId: string; onDone: () => void;
}) {
  const { t } = useTranslation();
  const [plan, setPlan] = useState(account.price.plan);
  const [amount, setAmount] = useState(account.price.amountCents == null ? "" : centsToUsd(account.price.amountCents).replace(/\.?0+$/, ""));
  const [currency, setCurrency] = useState(account.price.currency);
  const [cadence, setCadence] = useState(account.price.cadence);
  const [status, setStatus] = useState(account.price.status);
  const [targetId, setTargetId] = useState("");
  const save = useMutation({ mutationFn: () => subscriptionsApi.update(companyId, account.id, {
    expectedRevision: account.price.revision, plan, amountCents: amount.trim() ? usdToCents(amount.trim()) : null,
    currency: currency as typeof SUBSCRIPTION_CURRENCIES[number], cadence, status,
  }), onSuccess: onDone });
  const link = useMutation({ mutationFn: () => subscriptionsApi.link(companyId, account.id, targetId, account.price.revision,
    accounts.find(row => row.id === targetId)!.price.revision), onSuccess: onDone });
  const targets = accounts.filter(row => row.id !== account.id && row.provider === account.provider && row.canEdit);
  const busy = save.isPending || link.isPending;
  const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm";
  return <div className="space-y-5">
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
      <div className="space-y-2"><Label htmlFor="subscription-plan">{t("rest.subscriptionCostCard.plan")}</Label><Input id="subscription-plan" value={plan} onChange={event => setPlan(event.target.value)} required maxLength={100} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="subscription-price">{t("rest.subscriptionCostCard.pricePerBillingPeriod")}</Label><Input id="subscription-price" type="number" min="0" step="any" value={amount} placeholder={t("rest.subscriptionCostCard.unknown")} onChange={event => setAmount(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="subscription-currency">{t("rest.subscriptionCostCard.currency")}</Label><select id="subscription-currency" className={selectClass} value={currency} onChange={event => setCurrency(event.target.value)}>{SUBSCRIPTION_CURRENCIES.map(code => <option key={code}>{code}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="subscription-cadence">{t("rest.subscriptionCostCard.billed")}</Label><select id="subscription-cadence" className={selectClass} value={cadence} onChange={event => setCadence(event.target.value as typeof cadence)}><option value="month">{t("rest.subscriptionCostCard.monthly")}</option><option value="year">{t("rest.subscriptionCostCard.annually")}</option></select></div>
        <div className="space-y-2"><Label htmlFor="subscription-status">{t("rest.subscriptionCostCard.tracking")}</Label><select id="subscription-status" className={selectClass} value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="active">{t("rest.subscriptionCostCard.active")}</option><option value="ended">{t("rest.subscriptionCostCard.subscriptionEnded")}</option><option value="excluded">{t("rest.subscriptionCostCard.excludeFromThisOrganization")}</option></select></div>
      </div>
      <p className="text-xs text-muted-foreground">Enter the full amount for one account or seat. Annual prices are divided by 12. Changes apply from now. Ending tracking here does not cancel your provider subscription.</p>
      {save.error && <p role="alert" className="text-sm text-destructive">{t("rest.subscriptionCostCard.couldNotSaveThisPrice")}</p>}
      <div className="flex items-center justify-between"><Button type="button" variant="ghost" disabled={busy} onClick={onDone}>{t("rest.subscriptionCostCard.cancel")}</Button><Button type="submit" disabled={busy}>{save.isPending ? t("rest.subscriptionCostCard.saving") : t("rest.subscriptionCostCard.savePrice")}</Button></div>
    </form>
    {targets.length > 0 && <div className="space-y-2 border-t border-border pt-4">
      <Label htmlFor="subscription-link">{t("rest.subscriptionCostCard.sameSubscriptionAsAnotherAccount")}</Label>
      <select id="subscription-link" className={selectClass} value={targetId} onChange={event => setTargetId(event.target.value)}><option value="">{t("rest.subscriptionCostCard.chooseAnAccount")}</option>{targets.map(row => <option key={row.id} value={row.id}>{row.name} · {row.price.plan}</option>)}</select>
      <p className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.linkingCountsTheseAccountsOnce")}</p>
      {link.error && <p role="alert" className="text-sm text-destructive">{t("rest.subscriptionCostCard.couldNotLinkTheseAccounts")}</p>}
      <Button type="button" variant="outline" disabled={!targetId || busy} onClick={() => link.mutate()}>{t("rest.subscriptionCostCard.linkAccounts")}</Button>
    </div>}
  </div>;
}

export function SubscriptionCostCard({ companyId, report, error, onChanged }: {
  companyId: string; report?: SubscriptionCostReport; error?: unknown; onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionAccountReport | null>(null);
  const closeEditor = () => { setEditing(null); onChanged(); };
  const known = report?.monthlyTotals.length;
  const estimatedCount = report?.monthlyTotals.reduce((sum, total) => sum + total.estimatedCount, 0) ?? 0;
  return <>
    <Card className="block p-4">
      <div className="text-(length:--text-micro) uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{t("rest.subscriptionCostCard.subscriptions")}</div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">
        {known ? report!.monthlyTotals.map(total => <div key={total.currency}>{subscriptionMoney(total.amountCents, total.currency)}<span className="text-sm font-normal">/month</span></div>) : report && report.activeCount === 0 && report.accounts.length > 0 ? "$0.00/month" : "—"}
      </div>
      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
        {report ? <>
          {estimatedCount > 0 && <div><Badge variant="outline" className="font-normal text-muted-foreground">{estimatedCount < report.activeCount - report.unknownPriceCount ? t("rest.subscriptionCostCard.partiallyEstimated") : t("rest.subscriptionCostCard.estimated")}</Badge></div>}
          {report.unknownPriceCount > 0 && !!known && <div>{t("rest.subscriptionCostCard.knownMonthlySubtotal")}</div>}
          <div>{report.accounts.length === 0 ? t("rest.subscriptionCostCard.noVisibleSubscriptions") : <>{t("rest.subscriptionCostCard.active2", { activeCount: report.activeCount })}{" "}{report.activeCount === 1 ? "subscription" : "subscriptions"}{report.unknownPriceCount > 0 && t("rest.subscriptionCostCard.pricesUnknown", { count: report.unknownPriceCount, unknownPriceCount: report.unknownPriceCount })}</>}</div>
          {report.accounts.length > 0 && <div>{t("rest.subscriptionCostCard.monthlyFeesForAccountsVisible")}</div>}
          {report.unidentifiedAccountCount > 0 && <div>{t("rest.subscriptionCostCard.unconfirmed", { unidentifiedAccountCount: report.unidentifiedAccountCount })}{" "}{report.unidentifiedAccountCount === 1 ? t("rest.subscriptionCostCard.accountIdentity") : t("rest.subscriptionCostCard.accountIdentities")}</div>}
          <SubscriptionTokenUsage usage={report.subscription} />
        </> : error ? <div>{t("rest.subscriptionCostCard.subscriptionDataIsUnavailable")}</div> : <div>{t("rest.subscriptionCostCard.loadingSubscriptions")}</div>}
        {report && error ? <div>{t("rest.subscriptionCostCard.showingLastLoadedSubscriptionData")}</div> : null}
      </div>
      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setOpen(true)} disabled={!report}>{t("rest.subscriptionCostCard.viewDetails")}</Button>
    </Card>
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) setEditing(null); }}>
      <DialogContent className="max-h-(--sz-80vh) overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{editing ? t("rest.subscriptionCostCard.subscriptionPrice") : t("rest.subscriptionCostCard.subscriptions")}</DialogTitle><DialogDescription>{t("rest.subscriptionCostCard.currentMonthlyCostsForAccounts")}</DialogDescription></DialogHeader>
        {editing ? <SubscriptionEditor key={editing.id} companyId={companyId} account={editing} accounts={report?.accounts ?? []} onDone={closeEditor} /> : <div className="space-y-4">
          {report?.accounts.length === 0 && <p className="text-sm text-muted-foreground">{t("rest.subscriptionCostCard.noSubscriptionsAreVisibleTo")}</p>}
          {report?.accounts.map(account => <div key={account.id} className="space-y-2 border-b border-border pb-4 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="font-medium">{account.name}</div><div className="text-xs text-muted-foreground">{account.shared ? t("rest.subscriptionCostCard.shared") : account.ownerName ?? (account.ownerUserId ? t("rest.subscriptionCostCard.accountOwner") : t("rest.subscriptionCostCard.personalAccounts"))} · {providerDisplayName(account.provider)} · {account.price.plan}</div></div>
              <div className="text-right"><div className="font-mono">{account.price.status !== "active" ? account.price.status === "ended" ? t("rest.subscriptionCostCard.ended") : t("rest.subscriptionCostCard.excluded") : account.price.monthlyCents == null ? t("rest.subscriptionCostCard.priceUnknown") : `${subscriptionMoney(account.price.monthlyCents, account.price.currency)}/month`}</div><div className="text-xs text-muted-foreground">{account.price.source === "catalog" ? t("rest.subscriptionCostCard.estimatedBeforeTax") : account.price.source === "user" ? t("rest.subscriptionCostCard.userSupplied") : ""}{account.price.cadence === "year" ? t("rest.subscriptionCostCard.annualPayment12") : ""}</div></div>
            </div>
            <SubscriptionTokenUsage usage={account.usage} />
            {Number(account.usage.costCents) > 0 && <div className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.recordedUsageChargesInSelected", { cents: formatCents(Number(account.usage.costCents)) })}</div>}
            {account.agents.length > 0 && <div className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.usedBy", { join: account.agents.map(agent => agent.name).join(", ") })}</div>}
            {!account.identityVerified && <p className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.accountIdentityIsUnconfirmedLink")}</p>}
            {account.observedAt && <div className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.planChecked", { dateTime: formatDateTime(account.observedAt) })}{account.refreshStatus === "unavailable" ? t("rest.subscriptionCostCard.latestCheckUnavailable") : ""}</div>}
            {account.refreshStatus === "unavailable" && !account.observedAt && <p className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.theProviderDidNotMake")}</p>}
            {account.canEdit && <div><Button variant="outline" size="sm" onClick={() => setEditing(account)}>{t("rest.subscriptionCostCard.editPrice")}</Button></div>}
          </div>)}
          {!!report?.unattributedSubscription.eventCount && <p className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.someSubscriptionUsageHasNo")}</p>}
          <p className="text-xs text-muted-foreground">{t("rest.subscriptionCostCard.monthlyFeesCoverTheWhole")}</p>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
