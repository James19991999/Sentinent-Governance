/**
 * @jest-environment node
 */
const limitMock = jest.fn();
const RatelimitConstructorMock = jest.fn().mockImplementation(() => ({ limit: limitMock }));

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation((opts: unknown) => ({ __opts: opts })),
}));

jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(RatelimitConstructorMock, {
    slidingWindow: jest.fn((limit: number, window: string) => ({ limit, window })),
  }),
}));

describe("checkRateLimit (Upstash backend)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    limitMock.mockReset();
    RatelimitConstructorMock.mockClear();
    process.env = {
      ...ORIGINAL_ENV,
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("uses the Upstash backend when both env vars are configured, and maps a successful result", async () => {
    limitMock.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("uid:abc", 10, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(limitMock).toHaveBeenCalledWith("uid:abc");
  });

  it("maps a denied result with a positive retryAfterSeconds", async () => {
    limitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 30_000 });
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("uid:abc", 10, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("reuses a single Ratelimit instance across repeated calls with the same limit/window", async () => {
    limitMock.mockResolvedValue({ success: true, remaining: 5, reset: Date.now() + 60_000 });
    const { checkRateLimit } = await import("@/lib/rate-limit");
    await checkRateLimit("uid:a", 10, 60_000);
    await checkRateLimit("uid:b", 10, 60_000);
    expect(RatelimitConstructorMock).toHaveBeenCalledTimes(1);
  });

  it("fails open to the in-memory limiter if the Upstash call throws, instead of 500ing the request", async () => {
    limitMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("uid:abc", 10, 60_000);
    // In-memory fallback allows the first request for a fresh key
    expect(result.allowed).toBe(true);
  });

  it("falls back to in-memory when Upstash env vars are not set", async () => {
    process.env = { ...ORIGINAL_ENV, UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined };
    const { checkRateLimit } = await import("@/lib/rate-limit");
    await checkRateLimit("uid:abc", 10, 60_000);
    expect(limitMock).not.toHaveBeenCalled();
  });
});
