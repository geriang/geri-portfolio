import { Request, Response, NextFunction } from 'express';

interface IPState {
  active: number;
  queue: Array<{ req: Request; res: Response; next: NextFunction; position: number }>; // queued requests
}

const ipMap = new Map<string, IPState>();

function attachFinishTo(res: Response, state: IPState) {
  res.on('finish', () => {
    state.active--;
    if (state.queue.length > 0) {
      const nextItem = state.queue.shift()!;
      (nextItem.req as any).position = nextItem.position;
      state.active++;
      // Attach finish handler for the next request's response
      attachFinishTo(nextItem.res, state);
      nextItem.next();
    }
  });
}

export function concurrencyLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  let state = ipMap.get(ip);
  if (!state) {
    state = { active: 0, queue: [] };
    ipMap.set(ip, state);
  }

  if (state.active < 2) {
    state.active++;
    (req as any).position = null;
    attachFinishTo(res, state);
    next();
  } else {
    const position = state.active + state.queue.length;
    state.queue.push({ req, res, next, position });
    // Do not call next now; request will be processed later.
  }
}

