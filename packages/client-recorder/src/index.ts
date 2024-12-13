import { v4 as uuidv4 } from "uuid";
import { record } from "@rrweb/record";
import type { AuthTokenRequestFn } from "./types";
import EventSaver, { type EventSaverOptions, DEFAULT_EVENT_SYNC_INTERVAL_MS } from "./eventSaver";

type ClientRecorderOptions = {
  onError?: (error: Error) => void;
  syncOptions: Omit<EventSaverOptions, "pageloadId">;
};

type RecordOptions = {
  blockClass?: string;
  ignoreClass?: string;
  maskTextClass?: string;
};

class ClientRecorder {
  #eventSaver: EventSaver;
  #pageloadId: string;
  #running = false;
  #abortController: AbortController | undefined;
  #onError: ((error: Error) => void) | undefined; // TODO: Wire this up

  constructor(options: ClientRecorderOptions) {
    this.#pageloadId = uuidv4();
    this.#onError = (error: Error) => {
      // TODO: decide if we want to wrap errors in a custom error type
      if (options.onError) {
        options.onError(error);
      }
    };

    this.#eventSaver = new EventSaver({
      ...options.syncOptions,
      pageloadId: this.#pageloadId,
      onError: this.#onError,
    });
  }

  record(options: RecordOptions = {}) {
    if (this.#running) {
      return;
    }

    const _this = this;

    this.#abortController = new AbortController();
    const stopFn = record({
      sampling: {
        mousemove: false,
        mouseInteraction: false,
        input: "last",
        canvas: 1,
      },
      slimDOMOptions: {
        script: true,
        comment: true,
        headFavicon: true,
        headWhitespace: true,
        headMetaDescKeywords: true,
        headMetaSocial: true,
        headMetaRobots: true,
        headMetaHttpEquiv: true,
        headMetaAuthorship: true,
        headMetaVerification: true,
      },
      maskAllInputs: true,
      blockClass: options.blockClass || "complyco-block",
      ignoreClass: options.ignoreClass || "complyco-ignore",
      maskTextClass: options.maskTextClass || "complyco-mask",
      recordCanvas: false,

      emit(event) {
        _this.#eventSaver.addEvent({
          ...event,
          timeEpochMS: event.timestamp,
        });
      },
    });

    let interval = setInterval(() => this.forceSync(), DEFAULT_EVENT_SYNC_INTERVAL_MS);

    this.#abortController.signal.addEventListener("abort", () => {
      clearInterval(interval);

      if (stopFn) {
        stopFn();
      }

      this.forceSync();
    });

    // save events when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.forceSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange, { signal: this.#abortController.signal });

    this.#running = true;
  }

  forceSync() {
    this.#eventSaver.forceSync();
  }

  shutdown() {
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = undefined;
    }
    this.#running = false;
  }

  setOnAuthTokenRequested(fn: AuthTokenRequestFn) {
    return this.#eventSaver.setOnAuthTokenRequested(fn);
  }
}

export const createClientRecorder = (options: ClientRecorderOptions) => {
  return new ClientRecorder(options);
};

export type { AuthTokenRequestFn };
