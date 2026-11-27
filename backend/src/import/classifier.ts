import { TaskRule, TaskRulesConfig } from './taskRules';

/** Fallback task type every event gets when no rule matches (FR-14). */
export const UNCATEGORISED = 'Uncategorised';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Matches iff for EVERY key k in rule.match: k exists in metadata AND
 * lowercase(trim(metadata[k])) contains lowercase(trim(v)) for AT LEAST ONE
 * v in rule.match[k]. An empty match {} is a catch-all that matches everything.
 */
export function ruleMatches(metadata: Record<string, string>, rule: TaskRule): boolean {
  for (const [key, keywords] of Object.entries(rule.match)) {
    const value = metadata[key];
    if (typeof value !== 'string') return false;
    const haystack = normalize(value);
    if (!keywords.some((keyword) => haystack.includes(normalize(keyword)))) return false;
  }
  return true;
}

/**
 * Pure first-match-wins evaluation over the ordered rules.
 * No match, empty rules or empty metadata => UNCATEGORISED. Never throws.
 */
export function classify(metadata: Record<string, string>, config: TaskRulesConfig): string {
  for (const rule of config.rules) {
    if (ruleMatches(metadata, rule)) return rule.taskType;
  }
  return UNCATEGORISED;
}
