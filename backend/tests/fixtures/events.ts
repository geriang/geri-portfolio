import { RawUsageRecord } from '../../src/import/types';

/**
 * Generated fixture records (NFR-5): constants invented for these tests.
 * Metadata carries only classifier keyword keys (agent, command, title,
 * directory) — no prompt or response text anywhere.
 */

export const SAMPLE_TOOL_NAME = 'sample-tool';
export const DUMMY_TOOL_NAME = 'dummy-tool';

/** First sample tool's in-memory "local data". */
export const SAMPLE_RECORDS: readonly RawUsageRecord[] = [
  {
    sourceId: 'sample-001',
    occurredAtUtc: '2026-11-26T15:59:59Z', // 23:59:59 SG → 2026-11-26
    inputTokens: 100,
    outputTokens: 250,
    promptCount: 1,
    model: 'sample-model-1',
    metadata: { command: 'fix-crash', agent: 'debug-helper' },
  },
  {
    sourceId: 'sample-002',
    occurredAtUtc: '2026-11-26T16:00:00Z', // 00:00:00 SG → 2026-11-27
    inputTokens: 30,
    outputTokens: 120,
    promptCount: 1,
    model: 'sample-model-1',
    metadata: { command: 'draft-spec', title: 'quarterly docs', agent: 'writer' },
  },
  {
    sourceId: 'sample-003',
    occurredAtUtc: '2026-11-27T01:00:00Z',
    inputTokens: 5,
    outputTokens: 0,
    promptCount: 0,
    model: 'sample-model-2',
    metadata: { flavour: 'mint' }, // matches no rule → Uncategorised
  },
];

/** Second sample tool's ("dummy") in-memory "local data". */
export const DUMMY_RECORDS: readonly RawUsageRecord[] = [
  {
    sourceId: 'dummy-001',
    occurredAtUtc: '2026-11-26T23:30:00Z', // UTC date ≠ SG local date
    inputTokens: 40,
    outputTokens: 90,
    promptCount: 2,
    model: 'dummy-model-a',
    metadata: { agent: 'review-bot', command: 'review-pr' },
  },
  {
    sourceId: 'dummy-002',
    occurredAtUtc: '2026-11-28T02:15:00Z',
    inputTokens: 60,
    outputTokens: 210,
    promptCount: 1,
    model: 'dummy-model-a',
    metadata: { directory: '/repo/src/import', agent: 'build-runner' },
  },
  {
    sourceId: 'dummy-003',
    occurredAtUtc: '2026-12-31T16:00:00Z', // SG year rollover → 2027-01-01
    inputTokens: 15,
    outputTokens: 60,
    promptCount: 1,
    model: 'dummy-model-b',
    metadata: { title: 'how to configure nginx' },
  },
];
