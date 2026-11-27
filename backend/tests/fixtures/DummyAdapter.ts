import { ToolAdapter } from '../../src/import/adapter';
import { RawUsageRecord } from '../../src/import/types';
import { DUMMY_RECORDS, DUMMY_TOOL_NAME, SAMPLE_RECORDS, SAMPLE_TOOL_NAME } from './events';

/**
 * A second sample tool adapter (AC-6): implements ToolAdapter over in-memory
 * generated records. One new file like this is all a new tool needs.
 */
export class InMemoryToolAdapter implements ToolAdapter {
  constructor(
    readonly tool: string,
    private readonly records: readonly RawUsageRecord[],
  ) {}

  /** Window: inclusive since, exclusive until (ISO UTC). */
  readEvents(sinceUtc: string, untilUtc: string): Iterable<RawUsageRecord> {
    const since = Date.parse(sinceUtc);
    const until = Date.parse(untilUtc);
    return this.records.filter((record) => {
      const at = Date.parse(record.occurredAtUtc);
      return at >= since && at < until;
    });
  }
}

/** The dummy second adapter, plus the sibling first-tool adapter. */
export const dummyAdapter = new InMemoryToolAdapter(DUMMY_TOOL_NAME, DUMMY_RECORDS);
export const sampleToolAdapter = new InMemoryToolAdapter(SAMPLE_TOOL_NAME, SAMPLE_RECORDS);
