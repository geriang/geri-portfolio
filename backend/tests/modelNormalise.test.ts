import fs from 'fs';
import path from 'path';
import { MODEL_FALLBACK, normaliseModel } from '../src/import/modelNormalise';

/**
 * US-23 unit table for the pure model normaliser (AC-1/AC-2/AC-3 unit half).
 * Invented descriptor values only (NFR-5); nothing mocked, nothing thrown.
 */

// Invented descriptor vocabulary (same constants the fixture exports).
const PROVIDER = 'example-provider';
const MODEL_A = 'example-model-a';
const MODEL_B = 'example-model-b';

const desc = (fields: Record<string, unknown>) => JSON.stringify(fields);

/** Marker bait embedded inside bad-descriptor inputs (AC-3 bait). */
const UNIT_MARKER = 'MK-normalise-7b3e91c4';

describe('normaliseModel — descriptors (AC-1)', () => {
  test('descriptor string normalises to <providerID>/<id>, no braces or quotes', () => {
    const result = normaliseModel(desc({ id: MODEL_A, providerID: PROVIDER }));
    expect(result).toEqual({ model: `${PROVIDER}/${MODEL_A}`, source: 'descriptor' });
    expect(result.model).not.toMatch(/[{}"]/);
  });

  test('key order and extra fields do not change the stored value', () => {
    const idFirst = normaliseModel(
      desc({ id: MODEL_A, providerID: PROVIDER, extra: 'x1', tier: 'free' }),
    );
    const providerFirst = normaliseModel(desc({ providerID: PROVIDER, id: MODEL_A }));
    expect(idFirst).toEqual(providerFirst);
    expect(idFirst.model).toBe(`${PROVIDER}/${MODEL_A}`);
  });

  test('already-parsed object is handled exactly like the JSON string (R1)', () => {
    expect(normaliseModel({ id: MODEL_A, providerID: PROVIDER })).toEqual({
      model: `${PROVIDER}/${MODEL_A}`,
      source: 'descriptor',
    });
  });

  test('providerID missing → id alone; providerID non-string → id alone (treated as absent)', () => {
    expect(normaliseModel(desc({ id: MODEL_B }))).toEqual({
      model: MODEL_B,
      source: 'descriptor',
    });
    for (const absent of [42, { nested: true }, null, true]) {
      expect(normaliseModel(desc({ id: MODEL_B, providerID: absent }))).toEqual({
        model: MODEL_B,
        source: 'descriptor',
      });
    }
  });

  test('id parts are trimmed', () => {
    expect(normaliseModel(desc({ id: `  ${MODEL_A} `, providerID: ` ${PROVIDER}  ` }))).toEqual({
      model: `${PROVIDER}/${MODEL_A}`,
      source: 'descriptor',
    });
  });

  test('id empty / blank / missing / non-string → fallback (object and string forms)', () => {
    for (const unusable of ['', '   ', undefined, 7, {}, ['a']]) {
      const viaString = normaliseModel(desc({ id: unusable, providerID: PROVIDER }));
      expect(viaString).toEqual({ model: MODEL_FALLBACK, source: 'fallback' });
      const viaObject = normaliseModel({ id: unusable, providerID: PROVIDER });
      expect(viaObject).toEqual({ model: MODEL_FALLBACK, source: 'fallback' });
    }
  });
});

describe('normaliseModel — plain strings (AC-2)', () => {
  test('plain string is stored unchanged, source plain', () => {
    expect(normaliseModel('a-model-name')).toEqual({ model: 'a-model-name', source: 'plain' });
  });

  test('leading/trailing spaces are preserved (stored untrimmed)', () => {
    expect(normaliseModel('  a-model-name  ')).toEqual({
      model: '  a-model-name  ',
      source: 'plain',
    });
  });

  test('a string *containing* { (not at trimmed position 0) is plain', () => {
    expect(normaliseModel(`a-model {${UNIT_MARKER}}`)).toEqual({
      model: `a-model {${UNIT_MARKER}}`,
      source: 'plain',
    });
  });
});

describe('normaliseModel — fallback (AC-3)', () => {
  test('unparseable {...-leading strings → fallback; the value never appears in the result', () => {
    const bad = `{"id":"${MODEL_A}","providerID":"broken ${UNIT_MARKER}`;
    expect(normaliseModel(bad)).toEqual({ model: MODEL_FALLBACK, source: 'fallback' });
    // Exactly the string '{' (per the amended task-1 table).
    expect(normaliseModel('{')).toEqual({ model: MODEL_FALLBACK, source: 'fallback' });
  });

  test('non-object JSON VALUES passed directly (R3 row) → fallback', () => {
    for (const notAnObject of [[1, 2], 1.5, true, false, null, undefined]) {
      expect(normaliseModel(notAnObject)).toEqual({ model: MODEL_FALLBACK, source: 'fallback' });
    }
  });

  test('the strings "[1,2]" and "null" are plain — only {-leading trimmed text is descriptor-gated (R2b)', () => {
    expect(normaliseModel('[1,2]')).toEqual({ model: '[1,2]', source: 'plain' });
    expect(normaliseModel('null')).toEqual({ model: 'null', source: 'plain' });
  });

  test('the function never throws for any input (total over unknown)', () => {
    const inputs: unknown[] = [
      undefined,
      null,
      0,
      -1,
      NaN,
      true,
      false,
      '',
      '  ',
      '{',
      '{}',
      '[]',
      '[1,2]',
      'null',
      'true',
      '{"id":}',
      '{'.repeat(64),
      [],
      [1, 2],
      {},
      { id: MODEL_A, providerID: PROVIDER },
      { id: null },
      Object.create(null),
      JSON,
      Symbol('s'),
      () => undefined,
      new Date(),
      // circular object: JSON.stringify would throw — normaliseModel must not.
      (() => {
        const o: Record<string, unknown> = { id: MODEL_A };
        o.self = o;
        return o;
      })(),
    ];
    for (const input of inputs) {
      expect(() => normaliseModel(input)).not.toThrow();
      const result = normaliseModel(input);
      expect(typeof result.model).toBe('string');
      expect(['plain', 'descriptor', 'fallback']).toContain(result.source);
    }
  });
});

describe('diagnostic discipline (NFR-5)', () => {
  test('the module source contains no console.* or process.stdout writes', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'import', 'modelNormalise.ts'),
      'utf8',
    );
    expect(source).not.toContain('console.');
    expect(source).not.toContain('process.stdout');
  });

  test('MODEL_FALLBACK is the fixed safe constant', () => {
    expect(MODEL_FALLBACK).toBe('unknown');
  });
});
