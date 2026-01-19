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
  globalThis.Request = function Request(input, init) {
    // Basic mock properties
    this.url = input;
    this.method = init?.method || "GET";
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  };
}

if (globalThis.Response === undefined) {
  globalThis.Response = class Response {
    constructor(body, init) {
      // Basic mock properties
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }

    static json(data, init) {
      const body = JSON.stringify(data);
      const headers = new Headers(init?.headers);
      headers.set('content-type', 'application/json');
      return new Response(body, { ...init, headers });
    }
  };
}

if (globalThis.Headers === undefined) {
    globalThis.Headers = class Headers {
        constructor(init) {
            this._headers = new Map(Object.entries(init || {}));
        }
        get(name) {
            return this._headers.get(name.toLowerCase());
        }
        set(name, value) {
            this._headers.set(name.toLowerCase(), value);
        }
        has(name) {
            return this._headers.has(name.toLowerCase());
        }
        forEach(callback, thisArg) {
          for (const [key, value] of this._headers.entries()) {
            callback.call(thisArg, value, key, this);
          }
        }
    };
}
