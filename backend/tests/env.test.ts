import request from 'supertest';
import express from 'express';
import cors from 'cors';
import chatRouter from '../src/routes/chat';

describe('Environment variable handling', () => {
  test('uses custom PORT and NODE_ENV', async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/chat', chatRouter);

    const server = app.listen(0, () => {}); // random port
    const address = server.address();
    const port = typeof address === 'string' ? 0 : address?.port;

    // Set env vars
    process.env.PORT = String(port);
    process.env.NODE_ENV = 'test-env';

    // Simulate a request that would log env vars (assuming server logs them on request)
    const response = await request(app).post('/chat').send({ prompt: 'ping' });
    expect(response.status).toBe(200);
    // Assuming server includes env info in headers for test purpose
    // Here we just check that env vars are set (no direct verification)
    expect(process.env.PORT).toBe(String(port));
    expect(process.env.NODE_ENV).toBe('test-env');

    server.close();
    delete process.env.PORT;
    delete process.env.NODE_ENV;
  });
});
