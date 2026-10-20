import en from "./locales/en.json";

function lookup(key: string): string | null {
  let node: unknown = en;
  const parts = key.split(".");
  const leaf = parts.pop() as string;
  for (const part of parts) {
    if (!node || typeof node !== "object") return null;
    node = (node as Record<string, unknown>)[part];
  }
  if (!node || typeof node !== "object") return null;
  const messages = node as Record<string, unknown>;
  const value = messages[leaf] ?? messages[`${leaf}_other`] ?? messages[`${leaf}_one`];
  return typeof value === "string" ? value : null;
}

const CALL = String.raw`(?:i18n\.)?\bt\(\s*"([A-Za-z0-9_.-]+)"(?:\s*,\s*\{[^()]*?\})?\s*\)`;

export function expandCatalogCopy(source: string): string {
  return source
    .replace(new RegExp(`=\\{${CALL}\\}`, "g"), (match, key: string) => {
      const value = lookup(key);
      return value === null ? match : `=${JSON.stringify(value)}`;
    })
    .replace(new RegExp(`\\{${CALL}\\}`, "g"), (match, key: string) => lookup(key) ?? match)
    .replace(new RegExp(CALL, "g"), (match, key: string) => {
      const value = lookup(key);
      return value === null ? match : JSON.stringify(value);
    });
}
