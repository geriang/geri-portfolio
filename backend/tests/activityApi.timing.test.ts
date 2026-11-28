import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { createActivityRouter } from '../src/activity/activityRouter';
import {
  SEED_FROM_DAY,
  SEED_MODELS,
  SEED_TASK_TYPES,
  SEED_TO_DAY,
  SEED_TOOLS,
  seedActivityDb,
} from './fixtures/activitySeed';

/**
 * AC-8 (NFR-2 planning stand-in): a seeded 12-month payload answers 20
 * sequential full-range requests with 200, and the 95th-percentile
 * wall-clock latency of 100 measured sequential full-range requests (after
 * warm-up) stays under 300 ms. Median and max are REPORTED, not asserted —
 * a max-based gate is the flake source the story Notes warn about. The sprint
 * exit gate requires this file to pass in two consecutive runs.
 *
 * Task 11 support: the same full-range response JSON must stay < 512 KiB
 * for the 640-row seed; rows and bytes are logged as numbers only.
 */

jest.setTimeout(120_000);

const AC8_REQUESTS = 20;
const P95_REQUESTS = 100;
const WARMUP_REQUESTS = 5;
const P95_MS_BUDGET = 300; // AC-8 planning stand-in; the owner owns this number.
const MAX_PAYLOAD_BYTES = 512 * 1024;

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-timing-'));
const dbPath = path.join(tmpRoot, 'activity.db');
const facts = seedActivityDb({ dbPath, days: 320, rowsPerDay: 2 });

const app = express();
app.use('/activity', createActivityRouter({ dbPath }));

const FULL_RANGE = `/activity?from=${SEED_FROM_DAY}&to=${SEED_TO_DAY}`;

async function timedGet(): Promise<{ ms: number; status: number; text: string }> {
  const started = process.hrtime.bigint();
  const res = await request(app).get(FULL_RANGE);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  return { ms, status: res.status, text: res.text };
}

function percentile(samples: number[], p: number): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(samples.length * p) - 1];
}

describe('AC-8: full-range responses are fast and stable', () => {
  it('the seed actually meets the AC-8 floor (no passing on a thin DB)', () => {
    expect(facts.rows.length).toBeGreaterThanOrEqual(300);
    expect(facts.distinctDays).toBeGreaterThanOrEqual(300);
    expect(facts.distinctModels).toEqual([...SEED_MODELS].sort());
    expect(facts.distinctTaskTypes).toEqual([...SEED_TASK_TYPES].sort());
    expect(facts.distinctTools).toEqual([...SEED_TOOLS]);
    for (const model of facts.distinctModels) {
      expect(model).not.toContain('{');
      expect(model).not.toContain('}');
    }
  });

  it(`${AC8_REQUESTS} + ${P95_REQUESTS} sequential full-range requests stay under the budget`, async () => {
    for (let i = 0; i < WARMUP_REQUESTS; i += 1) {
      const warm = await timedGet();
      expect(warm.status).toBe(200);
    }

    // (a) AC-8's literal block: 20 sequential full-range requests, all 200.
    for (let i = 0; i < AC8_REQUESTS; i += 1) {
      const res = await timedGet();
      expect(res.status).toBe(200);
    }

    // (b) 100 further measured requests.
    const samples: number[] = [];
    let lastText = '';
    for (let i = 0; i < P95_REQUESTS; i += 1) {
      const res = await timedGet();
      expect(res.status).toBe(200);
      samples.push(res.ms);
      lastText = res.text;
    }
    expect(samples.length).toBe(P95_REQUESTS);
    // p95 over the 100 samples = the 95th value in ascending order (sorted[94]).
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[94];
    expect(p95).toBeLessThan(P95_MS_BUDGET);

    // (c) the served payload itself meets the row floor.
    const body = JSON.parse(lastText) as { rows: unknown[] };
    expect(body.rows.length).toBeGreaterThanOrEqual(300);

    // (d) ONE numbers-only report line (median/max reported, not asserted).
    const median = percentile(samples, 0.5);
    const max = Math.max(...samples);
    console.log(
      `activity:timing rows=${body.rows.length} requests=${AC8_REQUESTS + P95_REQUESTS}` +
        ` median_ms=${median.toFixed(3)} p95_ms=${p95.toFixed(3)} max_ms=${max.toFixed(3)}`,
    );

    // Task 11: payload stays well under 512 KiB for the 640-row seed.
    const bytes = Buffer.byteLength(lastText);
    expect(bytes).toBeLessThan(MAX_PAYLOAD_BYTES);
    console.log(`activity:payload rows=${body.rows.length} bytes=${bytes}`);
  });
});
