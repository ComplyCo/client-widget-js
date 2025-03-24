import EventSaver, { EventSaverOptions } from "../eventSaver";
import type { Plugin } from "../types";

describe("EventSaver", () => {
  let mockFetch: jest.Mock;
  let mockAuthTokenRequested: jest.Mock;
  let options: EventSaverOptions;

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    mockAuthTokenRequested = jest.fn().mockResolvedValue({ token: "test-token" });

    options = {
      baseUrl: "https://test.localhost",
      pageloadId: "test-pageload-id",
      onAuthTokenRequested: mockAuthTokenRequested,
      fetch: mockFetch,
    };
  });

  it("should queue events when auth token requester is not set", async () => {
    // Create EventSaver without auth token requester
    const saver = new EventSaver({
      ...options,
      onAuthTokenRequested: undefined,
    });

    // Add an event
    saver.addEvent({ type: "test", data: "data" });

    // Force sync - should queue but not send
    await saver.forceSync();

    // Verify no fetch was made
    expect(mockFetch).not.toHaveBeenCalled();

    // Set the auth token requester
    saver.setOnAuthTokenRequested(mockAuthTokenRequested);

    // Wait for any pending promises
    await new Promise(process.nextTick);

    // Verify the queued event was sent
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.localhost/api/v1/recorded_events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("should send events immediately when auth token requester is set", async () => {
    const saver = new EventSaver(options);

    saver.addEvent({ type: "test", data: "data" });
    await saver.forceSync();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        pageload_id: "test-pageload-id",
        events: [{ type: "test", data: "data" }],
      })
    );
  });

  it("should handle plugin modifications", async () => {
    const mockPlugin = {
      name: "test-plugin",
      beforeSend: (req: any) => ({
        ...req,
        headers: {
          ...req.headers,
          "X-Test": "test-value",
        },
      }),
    };

    const saver = new EventSaver({
      ...options,
      plugins: [mockPlugin],
    });

    saver.addEvent({ type: "test" });
    await saver.forceSync();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Test": "test-value",
        }),
      })
    );
  });

  it("should retry on auth failure", async () => {
    // First call fails with 401, second call succeeds
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 }).mockResolvedValueOnce({ ok: true, status: 200 });

    const saver = new EventSaver({
      ...options,
      retryDelayMs: 10, // Use a short delay for testing
    });

    saver.addEvent({ type: "test" });

    // Use Promise.all to wait for all promises to resolve
    await Promise.all([
      saver.forceSync(),
      // Wait a bit longer than the retry delay to ensure all retries complete
      new Promise((resolve) => setTimeout(resolve, 50)),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockAuthTokenRequested).toHaveBeenCalledTimes(2);
  });

  it("should handle errors", async () => {
    const mockOnError = jest.fn();
    const saver = new EventSaver({
      ...options,
      onError: mockOnError,
    });

    mockFetch.mockRejectedValue(new Error("Network error"));

    saver.addEvent({ type: "test" });

    await expect(saver.forceSync()).rejects.toThrow("Network error");
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
  });
});
