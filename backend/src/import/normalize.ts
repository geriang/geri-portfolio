import { classify } from './classifier';
import { toDayLocal } from './dayLocal';
import { TaskRulesConfig } from './taskRules';
import { RawUsageRecord, UsageEvent } from './types';

/**
 * Compose a RawUsageRecord + tool + rules config into the usage_event row
 * shape: fills tool, dayLocal (via the config timezone unless overridden)
 * and taskType (first-match-wins classifier).
 */
export function toUsageEvent(
  record: RawUsageRecord,
  tool: string,
  config: TaskRulesConfig,
  timeZone?: string,
): UsageEvent {
  return {
    tool,
    sourceId: record.sourceId,
    occurredAtUtc: record.occurredAtUtc,
    dayLocal: toDayLocal(record.occurredAtUtc, timeZone ?? config.timezone),
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    promptCount: record.promptCount,
    model: record.model,
    taskType: classify(record.metadata, config),
  };
}
