import { Request, Response, NextFunction } from 'express';

interface IPState {
  active: number;
  queue: Array<{ req: Request; res: Response; next: NextFunction; position: number }>; // queued requests
}

const ipMap = new Map<string, IPState>();

export function concurrencyLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip as string;
  let state = ipMap.get(ip);
  if (!state) {
    state = { active: 0, queue: [] };
    ipMap.set(ip, state);
  }

  const attachFinish = (stateRef: IPState) => {
    res.on('finish', () => {
      stateRef.active--;
      if (stateRef.queue.length > 0) {
        const nextItem = stateRef.queue.shift()!;
        (nextItem.req as any).position = nextItem.position;
        stateRef.active++;
        // Attach finish handler for dequeued request
        attachFinish(stateRef);
        nextItem.next();
      }
    });
  };

  if (state!.active < 2) {
    state!.active++;
    (req as any).position = null;
    attachFinish(state);
    next();
  } else {
    const position = state!.active + state!.queue.length;
    state!.queue.push({ req, res, next, position });
    // Do not call next now; request will be processed later.
  }
}

