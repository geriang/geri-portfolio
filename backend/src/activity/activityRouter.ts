import { Router } from 'express';
import { getActivity } from './activityService';
import { buildHardenedRouter } from '../hardening/activitySurface';

/**
 * US-4 express adapter: the whole route is one GET handler that hands the raw
 * query to the service and serialises its result. No SQL and no date rules
 * live here; the factory form (options.dbPath) is the single test seam and
 * lets US-5 re-mount the same router under hardening middleware without
 * editing this file.
 */

export interface ActivityRouterOptions {
  readonly dbPath?: string;
}

export function createActivityRouter(options: ActivityRouterOptions = {}): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const result = getActivity(
      { from: req.query.from, to: req.query.to },
      { dbPath: options.dbPath },
    );
    switch (result.status) {
      case 200:
      case 400:
      case 500:
        res.status(result.status).json(result.body);
        break;
    }
  });

  return router;
}

/**
 * US-5: the production mount is the hardened public surface — helmet
 * headers, the CORS allowlist, the 60-per-minute limiter and the method lock
 * wrap the raw factory above through a factory thunk. The factory itself
 * stays raw on purpose: the US-4 contract and timing suites compose it
 * directly, so a limiter baked into it would throttle those suites.
 */
export default buildHardenedRouter(() => createActivityRouter());
