// This setup function mocks global `fetch` for Mocha tests,
// returning fake responses for specific APIs (Google Routes, OpenAI, Resend).
// It simulates errors when the request body contains "fail" and ensures no real network calls are made.
// The original `fetch` is restored after tests to maintain test isolation.
import { before, after } from 'mocha';


const originalFetch = global.fetch;

export function setupMocks() {
  before(() => {

    global.fetch = async (input: Request | string | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (init?.body && typeof init.body === 'string' && init.body.includes('fail')) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('routes.googleapis.com')) {
        return new Response(JSON.stringify({
          routes: [{ duration: '600s', staticDuration: '300s' }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else if (url.includes('api.openai.com')) {
        return new Response(JSON.stringify({
          choices: [{ message: { content: 'This is a mocked AI message from Titan Freight Co.' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else if (url.includes('api.resend.com')) {
        return new Response(JSON.stringify({
          id: 'mocked_message_id'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
  });

  after(() => {
    global.fetch = originalFetch;
  });
}
