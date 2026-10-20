import { useEffect } from "react";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { NewAgentSetup } from "../components/new-agent/NewAgentSetup";
import { useTranslation } from "@/i18n";

export function NewAgent() {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([
      { label: t("agents.newAgent.agents"), href: "/agents" },
      { label: t("agents.newAgent.newAgent") },
    ]);
  }, [setBreadcrumbs, t]);
  return <NewAgentSetup />;
}
