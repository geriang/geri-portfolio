/**
 * Public contract for the US-2 ingestion core. US-3/US-4/US-17/US-18 import
 * everything from this single entry point.
 */
export type { RawUsageRecord, UsageEvent } from './types';
export { DEFAULT_TIMEZONE, DayConversionError, toDayLocal } from './dayLocal';
export {
  TaskRulesConfigError,
  defaultTaskRulesConfigPath,
  loadTaskRulesConfig,
  validateTaskRulesConfig,
} from './taskRules';
export type { TaskRule, TaskRulesConfig } from './taskRules';
export { UNCATEGORISED, classify, ruleMatches } from './classifier';
export {
  AdapterRegistryError,
  clearToolAdapters,
  getToolAdapter,
  listToolNames,
  registerToolAdapter,
} from './adapter';
export type { ToolAdapter } from './adapter';
export { toUsageEvent } from './normalize';
export {
  initActivitySchema,
  openActivityDb,
  upsertUsageEvents,
} from './activityDb';
export type { ActivityDbOptions, UpsertResult } from './activityDb';
