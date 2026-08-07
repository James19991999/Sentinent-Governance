/**
 * @jest-environment node
 */
import { checkRateLimit, _resetRateLimitStateForTests, identifierFromRequest } from "@/lib/rate-limit";

// These tests exercise the in-memory backend specifically — no
// UPSTASH_REDIS_REST_URL/TOKEN are set in the test environment, so
// checkRateLimit() falls through to it automatically. See
// upstash-rate-limit.test.ts for the Upstash-backend path (mocked, since
// there's no real Redis instance available in this sandbox either).
describe("checkRateLimit (in-memory backend)", () => {
  beforeEach(() => {
    _resetRateLimitStateForTests();
  });

  it("allows requests up to the limit within the window", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit("key-a", 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("denies the request that exceeds the limit", async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit("key-b", 5, 60_000);
    const sixth = await checkRateLimit("key-b", 5, 60_000);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit("key-c", 5, 60_000);
    const otherKey = await checkRateLimit("key-d", 5, 60_000);
    expect(otherKey.allowed).toBe(true);
  });

  it("resets the window after it elapses", async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit("key-e", 5, 100); // 100ms window
    expect((await checkRateLimit("key-e", 5, 100)).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect((await checkRateLimit("key-e", 5, 100)).allowed).toBe(true);
  });

  it("reports decreasing remaining count", async () => {
    const first = await checkRateLimit("key-f", 3, 60_000);
    const second = await checkRateLimit("key-f", 3, 60_000);
    expect(first.remaining).toBe(2);
    expect(second.remaining).toBe(1);
  });
});

describe("identifierFromRequest", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(identifierFromRequest(req, "fallback-id")).toBe("ip:1.2.3.4");
  });

  it("falls back when no forwarded-for header is present", () => {
    const req = new Request("http://localhost");
    expect(identifierFromRequest(req, "fallback-id")).toBe("fallback:fallback-id");
  });
});
