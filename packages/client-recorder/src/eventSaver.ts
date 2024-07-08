import type { Plugin, AuthTokenRequestFn, RequestHeadersAndBody } from "./types";

export const DEFAULT_EVENT_SYNC_INTERVAL_MS = 5_000;
export const DEFAULT_RETRY_COUNT = 3;

type Event = any;

enum BatchSyncStatus {
  Pending = "pending",
  Success = "success",
  Failed = "failed",
}

export type EventSaverOptions = {
  baseUrl: string;
  pageloadId: string;
  onAuthTokenRequested: AuthTokenRequestFn | undefined;
  plugins?: Plugin[];
  syncPeriodMs?: number;
  retryCount?: number;
  onError?: (error: Error) => void;
};

class EventSaver {
  baseUrl: string;
  onAuthTokenRequested: AuthTokenRequestFn | undefined;
  events: Event[];
  plugins: Plugin[];
  syncPeriodMs: number;
  batches: Map<string, { events: Event[]; status: BatchSyncStatus; batchId: string; pageloadId: string }>;
  retryCount: number;
  pageloadId: string;
  #cachedTokenPromise: Promise<{ token: string } | undefined> | undefined;
  #onError: ((error: Error) => void) | undefined;

  constructor(options: EventSaverOptions) {
    this.baseUrl = options.baseUrl;
    this.onAuthTokenRequested = options.onAuthTokenRequested;
    this.plugins = options.plugins || [];
    this.events = [];
    this.syncPeriodMs = options.syncPeriodMs || DEFAULT_EVENT_SYNC_INTERVAL_MS;
    this.batches = new Map();
    this.retryCount = options.retryCount || DEFAULT_RETRY_COUNT;
    this.pageloadId = options.pageloadId;
    this.#onError = options.onError;
  }

  addEvent(event: Event) {
    this.events.push(event);
  }

  #sync() {
    if (this.events.length === 0) {
      return;
    }

    const batchId = window.crypto.randomUUID();
    this.batches.set(batchId, {
      batchId,
      pageloadId: this.pageloadId,
      events: [...this.events],
      status: BatchSyncStatus.Pending,
    });
    this.events = [];

    return this.#save(batchId);
  }

  #logAndThrowError(err: Error): never {
    if (this.#onError) {
      this.#onError(err);
    }
    throw err;
  }

  #ensureCachedToken() {
    if (this.onAuthTokenRequested === undefined) {
      this.#logAndThrowError(new Error("onAuthTokenRequested is undefined"));
    }

    if (this.#cachedTokenPromise) {
      return;
    }

    this.#cachedTokenPromise = this.onAuthTokenRequested({});

    if (!this.#cachedTokenPromise) {
      this.#logAndThrowError(new Error("OnAuthTokenRequested returned an empty value"));
    }

    return;
  }

  async #save(batchId: string, retryCount = this.retryCount): Promise<void> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return;
    }
    if (batch.status !== BatchSyncStatus.Pending) {
      return;
    }
    if (batch.events.length === 0) {
      return;
    }

    this.#ensureCachedToken();

    try {
      const value = await this.#cachedTokenPromise;
      if (!value) {
        this.#logAndThrowError(new Error("onAuthTokenRequested's Promise returned an empty value"));
      }

      const body = JSON.stringify({
        pageload_id: batch.pageloadId,
        batch_id: batch.batchId,
        events: batch.events,
      });

      let req: RequestHeadersAndBody = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${value.token}`,
        },
        body,
      };

      for (const plugin of this.plugins) {
        if (plugin.beforeSend) {
          req = plugin.beforeSend(req);
        }
      }

      const response = await fetch(`${this.baseUrl}/api/v1/recorded_events`, req);

      if (!response.ok && !(response.status >= 400 && response.status < 500)) {
        if (response.status === 401) {
          // Clear the cached token
          this.#cachedTokenPromise = undefined;
          if (retryCount > 0) {
            return this.#save(batchId, retryCount - 1);
          }
        } else {
          batch.status = BatchSyncStatus.Failed;
          this.batches.delete(batch.batchId);
          this.#logAndThrowError(new Error("Failed to save to server"));
        }
      }
      batch.status = BatchSyncStatus.Success;
      this.batches.delete(batch.batchId);
    } catch (error) {
      if (retryCount > 0) {
        // Retry after a delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.#save(batchId, retryCount - 1);
      } else {
        batch.status = BatchSyncStatus.Failed;
        this.batches.delete(batch.batchId);
        this.#logAndThrowError(error as Error);
      }
    }
  }

  forceSync() {
    return this.#sync();
  }

  setOnAuthTokenRequested(fn: AuthTokenRequestFn) {
    if (!fn) {
      throw new Error("Invalid onAuthTokenRequested function");
    }

    this.onAuthTokenRequested = fn;
  }
}

export default EventSaver;
