import "@testing-library/jest-dom"

import { mockKv } from "./mockkv"

jest.mock("@vercel/kv", () => ({
  kv: mockKv,
}))

jest.mock("uncrypto", () => ({
  randomUUID: () => "test-uuid-1234",
}))

// Mocking Edge runtime globals
if (globalThis.Request === undefined) {
  globalThis.Request = class Request {
    constructor(input, init) {
      // Basic mock properties
      (this as any).url = input;
      (this as any).method = init?.method || "GET";
      (this as any).headers = new Headers(init?.headers);
      (this as any).body = init?.body;
    }
  } as any;
}

if (globalThis.Response === undefined) {
  globalThis.Response = class Response {
    constructor(body, init) {
      // Basic mock properties
      (this as any).body = body;
      (this as any).status = init?.status || 200;
      (this as any).statusText = init?.statusText || 'OK';
      (this as any).headers = new Headers(init?.headers);
    }

    static json(data, init) {
      const body = JSON.stringify(data);
      const headers = new Headers(init?.headers);
      headers.set('content-type', 'application/json');
      return new Response(body, { ...init, headers });
    }
  } as any;
}

if (globalThis.Headers === undefined) {
    globalThis.Headers = class Headers {
        constructor(init) {
            (this as any)._headers = new Map(Object.entries(init || {}));
        }
        get(name) {
            return (this as any)._headers.get(name.toLowerCase());
        }
        set(name, value) {
            (this as any)._headers.set(name.toLowerCase(), value);
        }
        has(name) {
            return (this as any)._headers.has(name.toLowerCase());
        }
        forEach(callback, thisArg) {
          for (const [key, value] of (this as any)._headers.entries()) {
            callback.call(thisArg, value, key, this);
          }
        }
    } as any;
}
