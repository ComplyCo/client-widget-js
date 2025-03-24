import { v4 as uuidv4 } from "uuid";
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
  retryCount?: number;
  onError?: (error: Error) => void;
  fetch?: typeof global.fetch;
  retryDelayMs?: number;
};

class EventSaver {
  #baseUrl: string;
  #onAuthTokenRequested: AuthTokenRequestFn | undefined;
  #events: Event[];
  #plugins: Plugin[];
  #batches: Map<string, { events: Event[]; status: BatchSyncStatus; batchId: string; pageloadId: string }>;
  #retryCount: number;
  #pageloadId: string;
  #cachedTokenPromise: Promise<{ token: string } | undefined> | undefined;
  #onError: ((error: Error) => void) | undefined;
  #pendingSyncs: Set<string>;
  #fetch: typeof global.fetch;
  #retryDelayMs: number;

  constructor(options: EventSaverOptions) {
    if (!isBaseUrlValid(options.baseUrl)) {
      this.#logAndThrowError(new Error("Invalid baseUrl"));
    }

    this.#baseUrl = options.baseUrl;
    this.#onAuthTokenRequested = options.onAuthTokenRequested;
    this.#plugins = options.plugins || [];
    this.#events = [];
    this.#batches = new Map();
    this.#retryCount = options.retryCount || DEFAULT_RETRY_COUNT;
    this.#pageloadId = options.pageloadId;
    this.#onError = options.onError;
    this.#fetch = (options.fetch || global.fetch).bind(global);
    this.#retryDelayMs = options.retryDelayMs || 1000;
    this.#pendingSyncs = new Set();
  }

  addEvent(event: Event) {
    this.#events.push(event);
  }

  #sync() {
    if (this.#events.length === 0) {
      return;
    }

    const batchId = uuidv4();
    this.#batches.set(batchId, {
      batchId,
      pageloadId: this.#pageloadId,
      events: [...this.#events],
      status: BatchSyncStatus.Pending,
    });
    this.#events = [];

    if (this.#onAuthTokenRequested === undefined) {
      this.#pendingSyncs.add(batchId);
      return;
    }

    return this.#save(batchId);
  }

  async #processPendingSyncs() {
    const syncs = [...Array.from(this.#pendingSyncs)];
    this.#pendingSyncs = new Set();

    for (const batchId of syncs) {
      await this.#save(batchId);
    }
  }

  #logAndThrowError(err: Error): never {
    if (this.#onError) {
      this.#onError(err);
    }
    throw err;
  }

  #ensureCachedToken() {
    if (this.#onAuthTokenRequested === undefined) {
      this.#logAndThrowError(new Error("onAuthTokenRequested is undefined"));
    }

    if (this.#cachedTokenPromise) {
      return;
    }

    this.#cachedTokenPromise = this.#onAuthTokenRequested({});

    if (!this.#cachedTokenPromise) {
      this.#logAndThrowError(new Error("OnAuthTokenRequested returned an empty value"));
    }

    return;
  }

  async #save(batchId: string, retryCount = this.#retryCount): Promise<void> {
    const batch = this.#batches.get(batchId);
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

      for (const plugin of this.#plugins) {
        if (plugin.beforeSend) {
          req = plugin.beforeSend(req);
        }
      }

      const url = `${this.#baseUrl}/api/v1/recorded_events`;
      if (!isBaseUrlValid(url)) {
        this.#logAndThrowError(new Error("Invalid baseUrl"));
      }

      const response = await this.#fetch(url, req);

      if (!response.ok) {
        if (response.status === 401) {
          // Clear the cached token
          this.#cachedTokenPromise = undefined;
          if (retryCount > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.#retryDelayMs));
            return this.#save(batchId, retryCount - 1);
          }
        } else {
          batch.status = BatchSyncStatus.Failed;
          this.#batches.delete(batch.batchId);
          this.#logAndThrowError(new Error("Failed to save to server"));
        }
      }
      batch.status = BatchSyncStatus.Success;
      this.#batches.delete(batch.batchId);
    } catch (error) {
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.#retryDelayMs));
        return this.#save(batchId, retryCount - 1);
      } else {
        batch.status = BatchSyncStatus.Failed;
        this.#batches.delete(batch.batchId);
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

    this.#onAuthTokenRequested = fn;

    this.#processPendingSyncs();
  }
}

export default EventSaver;

export const isBaseUrlValid = (baseUrl: string) => {
  if (!baseUrl) {
    return false;
  }

  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;
    if (!hostname) {
      return false;
    }

    // TODO: Consider using a __DEV__ flag to skip this unless we're running in dev mode
    if (hostname.endsWith(".local") || hostname.endsWith(".localhost")) {
      return true;
    }

    if (url.protocol !== "https:") {
      return false;
    }

    if (hostname.endsWith(".client.complyco.com") || hostname.endsWith(".client-qa.complyco.com")) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};
