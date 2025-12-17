import { v4 as uuidv4 } from "uuid";
import { record } from "@rrweb/record";
import type { RecordPlugin } from "@rrweb/types";
import type { AuthTokenRequestFn } from "./types";
import EventSaver, { type EventSaverOptions, DEFAULT_EVENT_SYNC_INTERVAL_MS } from "./eventSaver";

type ClientRecorderOptions = {
  onError?: (error: Error) => void;
  syncOptions: Omit<EventSaverOptions, "pageloadId">;
};

export type MaskInputFn = (text: string | null | undefined, element?: HTMLElement | null) => string;
export const unmaskComplyCoTaggedElements: MaskInputFn = (value, element) => {
  const safeValue = value ?? "";

  if (
    element instanceof HTMLElement &&
    (element.dataset.complycoUnmask === "true" || element.classList.contains("complyco-unmask"))
  ) {
    return safeValue;
  }

  return "*".repeat(safeValue.length);
};

type RecordOptions = {
  maskAllInputs?: boolean;
  blockClass?: string;
  ignoreClass?: string;
  maskTextClass?: string;
  captureNavigation?: boolean;
};

const navigationPlugin: RecordPlugin<{}> = {
  name: "complyco/navigation@1",
  observer(cb, options) {
    // Store original methods
    const abortController = new AbortController();
    const logIt = (url: string) => {
      if (!abortController.signal.aborted) {
        cb({
          url,
        });
      }
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      originalPushState.apply(history, args);
      logIt(window.location.href);
    };

    // Override replaceState
    history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
      originalReplaceState.apply(history, args);
      logIt(window.location.href);
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener(
      "popstate",
      function (event) {
        logIt(window.location.href);
      },
      {
        signal: abortController.signal,
      },
    );

    return () => {
      abortController.abort();
    };
  },
  options: {},
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

    const maskAllInputs = options.maskAllInputs ?? true;
    const maskInputFn = maskAllInputs ? unmaskComplyCoTaggedElements : undefined;
    const _this = this;

    this.#abortController = new AbortController();
    const stopFn = record({
      sampling: {
        mousemove: false,
        mouseInteraction: {
          MouseUp: true,
          MouseDown: true,
          Click: true,
          ContextMenu: false,
          DblClick: true,
          Focus: false,
          Blur: false,
          TouchStart: true,
          TouchEnd: true,
        },
        scroll: 200,
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
      maskAllInputs,
      blockClass: options.blockClass || "complyco-block",
      ignoreClass: options.ignoreClass || "complyco-ignore",
      maskTextClass: options.maskTextClass || "complyco-mask",
      maskInputFn,
      recordCanvas: false,
      plugins: options.captureNavigation ? [navigationPlugin] : [],

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
