import cors from 'cors';
import express, { type Express } from 'express';
import { createActivityRouter } from '../activity/activityRouter';
import {
  buildHardenedRouter,
  legacyCorsGuard,
  type ActivityRateLimiterOptions,
} from './activitySurface';

/**
 * US-5 test vehicle: a faithful replica of the planned src/index.ts
 * composition (trust proxy -> guarded wildcard cors() -> express.json() ->
 * hardened /activity mount) for supertest contract tests. It never calls
 * listen and never imports src/db.ts or the legacy routes, so it cannot open
 * the legacy portfolio database.
 */

export interface HardenedAppOptions {
  readonly dbPath?: string;
  readonly rateLimit?: ActivityRateLimiterOptions;
}

export function createHardenedActivityApp(options?: HardenedAppOptions): Express {
  const app = express();
  app.set('trust proxy', true); // AC-4: req.ip = client IP behind the tunnel proxy
  app.use(legacyCorsGuard(cors())); // the legacy wildcard, active for non-activity paths only
  app.use(express.json());
  app.use(
    '/activity',
    buildHardenedRouter(() => createActivityRouter({ dbPath: options?.dbPath }), {
      rateLimit: options?.rateLimit,
    }),
  );
  return app;
}
