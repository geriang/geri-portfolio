"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concurrencyLimit = concurrencyLimit;
const ipMap = new Map();
function concurrencyLimit(req, res, next) {
    const ip = req.ip;
    let state = ipMap.get(ip);
    if (!state) {
        state = { active: 0, queue: [] };
        ipMap.set(ip, state);
    }
    const attachFinish = (stateRef) => {
        res.on('finish', () => {
            stateRef.active--;
            if (stateRef.queue.length > 0) {
                const nextItem = stateRef.queue.shift();
                nextItem.req.position = nextItem.position;
                stateRef.active++;
                // Attach finish handler for dequeued request
                attachFinish(stateRef);
                nextItem.next();
            }
        });
    };
    if (state.active < 2) {
        state.active++;
        req.position = null;
        attachFinish(state);
        next();
    }
    else {
        const position = state.active + state.queue.length;
        state.queue.push({ req, res, next, position });
        // Do not call next now; request will be processed later.
    }
}
