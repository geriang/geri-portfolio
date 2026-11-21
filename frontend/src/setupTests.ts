import '@testing-library/jest-dom';

// jsdom does not provide a global `fetch`. Some unit tests spy on it
// (jest.spyOn(global, 'fetch')); give it a no-op so those tests can run in any
// environment. Tests that need behaviour override the spy themselves.
if (typeof global.fetch === 'undefined') {
  // @ts-expect-error - runtime assignment of a missing global
  global.fetch = () => Promise.resolve({ json: async () => ({}) });
}
