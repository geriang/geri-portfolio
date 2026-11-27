/**
 * US-23: shared model-descriptor normaliser for tool adapters.
 *
 * The real opencode database stores its model as a JSON descriptor — an
 * object with `id` and `providerID` — delivered either as a JSON string or
 * as an already-parsed object. Storing that raw text in usage_event.model
 * would multiply every group-by-model query (FR-8, BR-5), so adapters pass
 * every candidate value through this pure helper first.
 *
 * Stored shapes (see modelNormalise.test.ts for the full rule table):
 *   descriptor  -> `<providerID>/<id>`, or the `id` alone when providerID is
 *                  absent or not a non-empty string;
 *   plain       -> any other non-empty string, stored exactly as given;
 *   fallback    -> the fixed constant MODEL_FALLBACK for values that are
 *                  present but unusable (unparseable `{...`, non-object JSON,
 *                  missing/empty/non-string `id`, or a non-string type).
 *
 * The fallback absorbs drift silently by design (one bad row must not stop a
 * whole import), so the numeric fallback count is the only allowed signal.
 * A source model literally named `unknown` is stored unchanged (AC-2) and
 * counts as a fallback too — an informational conflation only.
 *
 * Safety (NFR-5): imports nothing, never throws, never logs, and never
 * interpolates a source value into any message.
 */

/** Fixed safe value stored when a model value is present but unusable. */
export const MODEL_FALLBACK = 'unknown';

/** How `model` was derived from the source value. */
export type ModelSource = 'plain' | 'descriptor' | 'fallback';

export interface ModelNormalisation {
  /** Value stored in usage_event.model. */
  model: string;
  source: ModelSource;
}

const FALLBACK: ModelNormalisation = { model: MODEL_FALLBACK, source: 'fallback' };

/** fallback := the fixed safe constant (rules reference this by name). */
function fallback(): ModelNormalisation {
  return FALLBACK;
}

/**
 * D — descriptor handling of an object `o`: `id` must be a non-blank string
 * or the value is unusable; `providerID` counts as present only when it is a
 * string with non-empty trim (present-but-not-a-string is treated as absent).
 * Extra fields are ignored and key order is irrelevant, so descriptors that
 * differ only in those ways normalise to the same stored value (AC-1).
 */
function normaliseDescriptorObject(o: Record<string, unknown>): ModelNormalisation {
  const id = o['id'];
  if (typeof id !== 'string' || id.trim() === '') {
    return fallback();
  }
  const providerID = o['providerID'];
  if (typeof providerID === 'string' && providerID.trim() !== '') {
    return { model: `${providerID.trim()}/${id.trim()}`, source: 'descriptor' };
  }
  return { model: id.trim(), source: 'descriptor' };
}

/**
 * normaliseModel — the complete US-23 rule table (R1–R3, D); total over
 * `unknown`, never throws, never logs.
 *
 * R1: parsed object (non-null, not an array) -> apply D.
 * R2: string -> trim; trimmed text starting with `{` is JSON.parse'd (R2a):
 *     parse failure, or a result that is not a non-null non-array object,
 *     is the fallback; otherwise D applies to the parse result. A string not
 *     starting with `{` is a plain name stored UNTRIMMED (R2b, AC-2 "that
 *     string unchanged").
 * R3: any other value (number, boolean, array, null, undefined) -> fallback.
 */
export function normaliseModel(value: unknown): ModelNormalisation {
  // R1 — already-parsed descriptor object.
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return normaliseDescriptorObject(value as Record<string, unknown>);
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (t.startsWith('{')) {
      // R2a — looks like a JSON descriptor.
      let parsed: unknown;
      try {
        parsed = JSON.parse(t);
      } catch {
        return fallback();
      }
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return normaliseDescriptorObject(parsed as Record<string, unknown>);
      }
      return fallback();
    }
    // R2b — plain name, stored exactly as supplied (not trimmed).
    return { model: value, source: 'plain' };
  }
  // R3 — everything else is unusable.
  return fallback();
}
