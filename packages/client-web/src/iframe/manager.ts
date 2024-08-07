import { ComplyCoAPIAuth } from "../auth";
import {
  ParentIframeCommunicator,
  ParentEventType,
  type CompletePayload,
  type ChildCompleteEvent,
} from "./communicator";

export type ShutdownErrorReason = {
  reason: "error";
  error: any;
};

export type ShutdownUserClosedReason = {
  reason: "userClosed";
};

export type ShutdownReason = ShutdownErrorReason | ShutdownUserClosedReason;

export type IframeManagerOptions = {
  path: string;
  apiAuth: ComplyCoAPIAuth;
  events: {
    onLoad?: (_: { iframe: HTMLIFrameElement }) => void;
    onStarted?: () => void;
    onShutdown: (reason: ShutdownReason) => void;
    onComplete: (payload: CompletePayload) => void;
    onResize?: (_: { size: "small" | "large" }) => void;
    onHeartbeatAge?: (ageMs: number) => void;
  };
};
export default class IframeManager {
  #options: IframeManagerOptions;
  #iframe: HTMLIFrameElement | undefined;
  #communicator: ParentIframeCommunicator | undefined;

  constructor(options: IframeManagerOptions) {
    this.#options = options;
  }

  #initIframe(iframe: HTMLIFrameElement) {
    // NOTE: the caller should manage the iframe's visibility
    // const iframe = this.#options.iframe;
    iframe.src = this.#options.apiAuth.clientUrl(this.#options.path);

    iframe.onerror = (event, source, lineno, number, error) => {
      this.#shutdown({
        reason: "error",
        error: error,
      });
    };

    this.#iframe = iframe;
  }

  #initCommunicator() {
    if (!this.#iframe) {
      throw new Error("iframe not initialized");
    }

    const communicator = new ParentIframeCommunicator({
      eventHandlers: {
        onNeedsAuthorizationMessage: async (data) => {
          const res = await this.#options.apiAuth.checkAuth({});

          if (res) {
            communicator?.send({
              type: ParentEventType.AUTHORIZATION,
              payload: {
                token: res.token,
              },
            });
          }
        },
        onResizeMessage: (data) => {
          if (this.#options.events.onResize) {
            this.#options.events.onResize({ size: data.payload.size });
          }
        },
        onChildHeartbeatAge: (data: number) => {
          if (this.#options.events.onHeartbeatAge) {
            this.#options.events.onHeartbeatAge(data);
          }
        },
        onCloseMessage: (data) => {
          this.#shutdown({
            reason: "userClosed",
          });
        },
        onCompleteMessage: (event: ChildCompleteEvent) => {
          this.#complete(event.payload);
        },
        onChildDead: (reason: string) => {
          this.#shutdown({
            reason: "error",
            error: new Error(reason),
          });
        },
        onLoaded: () => {
          if (this.#options.events.onLoad && this.#iframe) {
            this.#options.events.onLoad({ iframe: this.#iframe });
          }
        },
      },
      healthCheckIntervalMs: 100,
      healthCheckFailuresBeforeDead: 15,
      childIframe: this.#iframe,
      childOrigin: this.#options.apiAuth.baseUrl,
    });

    // TODO: If we don't get the loaded event in a reasonable amount of time, we should close the iframe (or make it configurable)
    // TODO: decide if we want to rename this event "require_auth" or "auth_required", we probably still want the loaded event
    // TODO: Add a resize event so the iframe can request a resize. This will be dependent on the viewport dimensions

    communicator.addListeners();
    this.#communicator = communicator;
  }

  start = (iframe?: HTMLIFrameElement | undefined | null) => {
    this.run(iframe);
    if (this.#options.events.onStarted) {
      this.#options.events.onStarted();
    }
  };

  run = (iframe?: HTMLIFrameElement | undefined | null) => {
    if (iframe) {
      this.#initIframe(iframe);
      this.#initCommunicator();
    }
  };

  #shutdown(reason: ShutdownReason) {
    this.unmount();
    this.#options.events.onShutdown(reason);
  }

  #complete(data: CompletePayload) {
    this.#options.events.onComplete(data);
  }

  unmount() {
    if (this.#communicator) {
      this.#communicator.removeListeners();
    }
    if (this.#iframe) {
      this.#iframe.src = "";
    }
    // TODO: Figure out if we need to clear out the iframe and communicator
  }
}
