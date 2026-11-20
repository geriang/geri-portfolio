import { promptCache } from '../src/cache/promptCache';

describe('PromptCache performance', () => {
  test('second get call is fast (<100ms)', () => {
    const key = 'test-key';
    const response = { data: 'response' };
    promptCache.set(key, response);
    const start = Date.now();
    const first = promptCache.get(key);
    const mid = Date.now();
    const second = promptCache.get(key);
    const end = Date.now();
    // Ensure values are returned
    expect(first).toEqual(response);
    expect(second).toEqual(response);
    // Measure time between calls
    const firstDuration = mid - start;
    const secondDuration = end - mid;
    // secondDuration should be very small, less than 100ms
    expect(secondDuration).toBeLessThan(100);
  });
});
