import request from 'supertest';
import express from 'express';
import cors from 'cors';
import chatRouter from '../src/routes/chat';
import { concurrencyLimit } from '../src/middleware/concurrency';

// Helper to create an app instance for testing
function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  // Apply chat router (which includes its own concurrency middleware)
  app.use('/chat', chatRouter);
  return app;
}

describe('POST /chat endpoint', () => {
  test('returns a message for a normal request', async () => {
    const app = createApp();
    const response = await request(app).post('/chat').send({ prompt: 'Hello world' });
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Mock response/);
    expect(response.body.position).toBeUndefined();
  });

  test('queues requests beyond concurrency limit and returns position', async () => {
    const app = createApp();
    // Fire three requests almost simultaneously
    const p1 = request(app).post('/chat').send({ prompt: 'First' });
    const p2 = request(app).post('/chat').send({ prompt: 'Second' });
    const p3 = request(app).post('/chat').send({ prompt: 'Third' });

    const results = await Promise.all([p1, p2, p3]);
    const positions = results.map(r => r.body.position).filter(p => p !== undefined);
    // One of them should have position 2 (the third queued request)
    expect(positions).toContain(2);
  });

  test('caches starter prompt responses under 100ms', async () => {
    const app = createApp();
    const starter = 'Explain the portfolio summary.';
    const startTime = Date.now();
    const first = await request(app).post('/chat').send({ prompt: starter });
    const firstDuration = Date.now() - startTime;
    expect(first.status).toBe(200);

    const secondStart = Date.now();
    const second = await request(app).post('/chat').send({ prompt: starter });
    const secondDuration = Date.now() - secondStart;
    expect(second.status).toBe(200);
    // Expect second call to be fast (under 100ms)
    expect(secondDuration).toBeLessThanOrEqual(100);
  });
});
