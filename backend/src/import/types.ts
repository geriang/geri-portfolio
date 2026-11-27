/**
 * Shared data shapes for the usage ingestion core (US-2).
 * Contract between adapters, the classifier, the importer and storage.
 */

export interface RawUsageRecord {
  /** Stable per-tool record id; UNIQUE(tool, source_id) key. */
  sourceId: string;
  /** ISO 8601 with explicit UTC designator, e.g. "2026-11-26T15:59:59Z". */
  occurredAtUtc: string;
  /** integer >= 0 */
  inputTokens: number;
  /** integer >= 0 */
  outputTokens: number;
  /** integer >= 0 (0 for assistant-side records, e.g.) */
  promptCount: number;
  /** model name, stored and shown (BR-5). */
  model: string;
  /**
   * Classifier input only (agent, command, directory, title keywords);
   * MUST NOT contain prompt or response text (BR-1); never stored.
   */
  metadata: Record<string, string>;
}

export interface UsageEvent {
  tool: string;
  sourceId: string;
  occurredAtUtc: string;
  /** YYYY-MM-DD, Asia/Singapore (BR-4). */
  dayLocal: string;
  inputTokens: number;
  outputTokens: number;
  promptCount: number;
  model: string;
  /** One of config.taskTypes. */
  taskType: string;
}
