import { RawUsageRecord } from './types';

/**
 * Per-tool strategy: read a tool's local data and yield RawUsageRecords.
 * Adding a tool = one new adapter file (NFR-10, ADR-3); no schema change.
 */
export interface ToolAdapter {
  /** Allow-listed tool name, e.g. "opencode". */
  readonly tool: string;
  /**
   * Window is inclusive-since, exclusive-until, ISO UTC. Adapters open only
   * read-only sources and drop all prompt/response text (BR-1, ADR-6).
   */
  readEvents(sinceUtc: string, untilUtc: string): Iterable<RawUsageRecord>;
}

/** Thrown on double registration of the same tool (typo guard). */
export class AdapterRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdapterRegistryError';
  }
}

const registry = new Map<string, ToolAdapter>();

export function registerToolAdapter(adapter: ToolAdapter): void {
  if (registry.has(adapter.tool)) {
    throw new AdapterRegistryError(
      `A tool adapter for "${adapter.tool}" is already registered`,
    );
  }
  registry.set(adapter.tool, adapter);
}

export function getToolAdapter(tool: string): ToolAdapter | undefined {
  return registry.get(tool);
}

export function listToolNames(): string[] {
  return [...registry.keys()];
}

/** Test isolation helper; US-3's CLI registers adapters once at boot. */
export function clearToolAdapters(): void {
  registry.clear();
}
