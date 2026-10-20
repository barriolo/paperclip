import en from "./locales/en.json";
import { i18n } from ".";

let keysByEnglish: Map<string, string[]> | null = null;

function index() {
  if (keysByEnglish) return keysByEnglish;
  const map = new Map<string, string[]>();
  const walk = (node: unknown, prefix: string) => {
    if (typeof node === "string") {
      const key = prefix.replace(/_(zero|one|two|few|many|other)$/, "");
      const list = map.get(node) ?? [];
      if (!list.includes(key)) list.push(key);
      map.set(node, list);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, prefix ? `${prefix}.${k}` : k);
  };
  walk(en, "");
  keysByEnglish = map;
  return map;
}

export function isCopy(value: string | null | undefined, english: string): boolean {
  if (value == null) return false;
  if (value === english) return true;
  const keys = index().get(english);
  if (!keys) return false;
  return keys.some((key) => i18n.t(key) === value);
}
