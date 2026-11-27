import fs from 'fs';
import path from 'path';

/** A single classification rule: keyword sets per metadata key. */
export interface TaskRule {
  /** Must be in config.taskTypes. */
  taskType: string;
  /** Keyword sets per metadata key; at least one keyword per key must match. */
  match: Record<string, string[]>;
}

export interface TaskRulesConfig {
  /** Loader rejects other versions. */
  version: 1;
  /** IANA zone, default "Asia/Singapore" (BR-4). */
  timezone: string;
  /** Fixed list; last element must be "Uncategorised" (BR-6, FR-14). */
  taskTypes: string[];
  /** Ordered; first match wins. */
  rules: TaskRule[];
}

/**
 * Thrown when the config fails validation. Messages quote only config field
 * names/positions (the config is repo content, so this is NFR-5 safe).
 */
export class TaskRulesConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskRulesConfigError';
  }
}

/** Repo config: backend/config/task-rules.json, reached from src/import or dist/import. */
export function defaultTaskRulesConfigPath(): string {
  return path.join(__dirname, '..', '..', 'config', 'task-rules.json');
}

/**
 * Validate a raw parsed config; throws TaskRulesConfigError naming the field
 * and index of the first violation.
 */
export function validateTaskRulesConfig(raw: unknown): TaskRulesConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new TaskRulesConfigError('config: expected an object');
  }
  const cfg = raw as Record<string, unknown>;

  if (cfg.version !== 1) {
    throw new TaskRulesConfigError(`version: expected 1, got ${JSON.stringify(cfg.version)}`);
  }
  if (typeof cfg.timezone !== 'string' || cfg.timezone.trim() === '') {
    throw new TaskRulesConfigError('timezone: expected a non-empty string');
  }

  if (!Array.isArray(cfg.taskTypes) || cfg.taskTypes.length === 0) {
    throw new TaskRulesConfigError('taskTypes: expected a non-empty array');
  }
  const taskTypes = cfg.taskTypes as unknown[];
  if (!taskTypes.every((t) => typeof t === 'string' && t !== '')) {
    throw new TaskRulesConfigError('taskTypes: every entry must be a non-empty string');
  }
  const seen = new Set<string>();
  for (const t of taskTypes as string[]) {
    if (seen.has(t)) {
      throw new TaskRulesConfigError(`taskTypes: duplicate entry "${t}"`);
    }
    seen.add(t);
  }
  const UNCATEGORISED = 'Uncategorised';
  if (!seen.has(UNCATEGORISED)) {
    throw new TaskRulesConfigError(`taskTypes: "${UNCATEGORISED}" is required (FR-14)`);
  }
  if (taskTypes[taskTypes.length - 1] !== UNCATEGORISED) {
    throw new TaskRulesConfigError(
      `taskTypes: "${UNCATEGORISED}" must be the last entry, got "${String(taskTypes[taskTypes.length - 1])}"`,
    );
  }

  if (!Array.isArray(cfg.rules)) {
    throw new TaskRulesConfigError('rules: expected an array');
  }
  const rules: TaskRule[] = [];
  (cfg.rules as unknown[]).forEach((rawRule, index) => {
    const where = `rules[${index}]`;
    if (typeof rawRule !== 'object' || rawRule === null || Array.isArray(rawRule)) {
      throw new TaskRulesConfigError(`${where}: expected an object`);
    }
    const rule = rawRule as Record<string, unknown>;
    if (typeof rule.taskType !== 'string') {
      throw new TaskRulesConfigError(`${where}.taskType: expected a string`);
    }
    if (!seen.has(rule.taskType)) {
      throw new TaskRulesConfigError(
        `${where}.taskType: "${rule.taskType}" is not in taskTypes`,
      );
    }
    if (typeof rule.match !== 'object' || rule.match === null || Array.isArray(rule.match)) {
      throw new TaskRulesConfigError(`${where}.match: expected an object of keyword arrays`);
    }
    const match: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(rule.match as Record<string, unknown>)) {
      if (!Array.isArray(value) || value.length === 0) {
        throw new TaskRulesConfigError(
          `${where}.match.${key}: expected a non-empty array of keywords`,
        );
      }
      if (!(value as unknown[]).every((k) => typeof k === 'string' && k.trim() !== '')) {
        throw new TaskRulesConfigError(
          `${where}.match.${key}: every keyword must be a non-empty string`,
        );
      }
      match[key] = value as string[];
    }
    rules.push({ taskType: rule.taskType, match });
  });

  return {
    version: 1,
    timezone: cfg.timezone,
    taskTypes: taskTypes as string[],
    rules,
  };
}

/**
 * Load and validate the rules config.
 * Path precedence: argument > env TASK_RULES_CONFIG_PATH > defaultTaskRulesConfigPath().
 */
export function loadTaskRulesConfig(configPath?: string): TaskRulesConfig {
  const resolved = configPath ?? process.env.TASK_RULES_CONFIG_PATH ?? defaultTaskRulesConfigPath();
  let text: string;
  try {
    text = fs.readFileSync(resolved, 'utf8');
  } catch {
    throw new TaskRulesConfigError(`cannot read config file "${resolved}"`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new TaskRulesConfigError(
      `config file "${resolved}" is not valid JSON: ${(err as Error).message}`,
    );
  }
  return validateTaskRulesConfig(parsed);
}
