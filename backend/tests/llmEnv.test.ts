import request from 'supertest';
import express from 'express';
import cors from 'cors';
import chatRouter from '../src/routes/chat';
import axios from 'axios';

jest.mock('axios');
const mockedPost = axios.post as jest.MockedFunction<typeof axios.post>;

describe('LLM_URL environment variable handling', () => {
  test('uses LLM_URL when set', async () => {
    process.env.LLM_URL = 'http://mock-llm';
    mockedPost.mockResolvedValue({ data: { message: 'Mock LLM response' } } as any);

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/chat', chatRouter);

    const response = await request(app).post('/chat').send({ prompt: 'test' });
    expect(response.body.message).toBe('Mock LLM response');
    expect(mockedPost).toHaveBeenCalledWith('http://mock-llm', { prompt: expect.any(String) });

    delete process.env.LLM_URL;
  });
});
