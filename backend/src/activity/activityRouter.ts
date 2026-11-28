import { Router } from 'express';
import { getActivity } from './activityService';

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
 * Unbound instance for src/index.ts: with no dbPath option the reused open
 * helper resolves ACTIVITY_DB_PATH at request time, so the process only
 * needs the environment variable, never a code-level path.
 */
export default createActivityRouter();
