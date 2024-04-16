import { StateType } from "../api/getTasks";

// Events sent from the child iframe to the parent iframe
export enum ChildEventType {
  NEEDS_AUTHORIZATION = "needs_authorization",
  REQUEST_SIZE = "request_size",
  CLOSE = "close",
  COMPLETE = "complete",
  HEALTH_RESPONSE = "health_response",
  VIEW_CHANGE = "view_change",
}

type HealthPayload = {
  id: number;
};

type SizePayload = {
  size: "small" | "large";
};

export type CompletePayload = {
  lastHumanAction: StateType.Scrolled | StateType.Accepted | StateType.Rejected | StateType.Signed | undefined;
  isTerminalAction: boolean;
};

type ChildNeedsAuthorizationEvent = {
  type: ChildEventType.NEEDS_AUTHORIZATION;
};

type ChildRequestSizeEvent = {
  type: ChildEventType.REQUEST_SIZE;
  payload: SizePayload;
};

type ChildCloseEvent = {
  type: ChildEventType.CLOSE;
};

export type ChildCompleteEvent = {
  type: ChildEventType.COMPLETE;
  payload: CompletePayload;
};

type ChildHealthResponseEvent = {
  type: ChildEventType.HEALTH_RESPONSE;
  payload: HealthPayload;
};

type ChildViewChangeEvent = {
  type: ChildEventType.VIEW_CHANGE;
};

type ChildEvent =
  | ChildNeedsAuthorizationEvent
  | ChildRequestSizeEvent
  | ChildCloseEvent
  | ChildCompleteEvent
  | ChildHealthResponseEvent
  | ChildViewChangeEvent;

// Events sent from the parent iframe to the child iframe
export enum ParentEventType {
  AUTHORIZATION = "authorization",
  CURRENT_SIZE = "current_size", // This allows the parent to tell the child the current size of the iframe
  HEALTH_REQUEST = "health_request", // This allows the parent to check the liveness of the child
}

type ParentAuthorizationEvent = {
  type: ParentEventType.AUTHORIZATION;
  payload: {
    token: string;
  };
};

type ParentCurrentSizeEvent = {
  type: ParentEventType.CURRENT_SIZE;
  payload: SizePayload;
};

type ParentHealthRequestEvent = {
  type: ParentEventType.HEALTH_REQUEST;
  payload: HealthPayload;
};

type ParentEvent = ParentAuthorizationEvent | ParentCurrentSizeEvent | ParentHealthRequestEvent;

type ParentIframeCommunicatorOptions = {
  eventHandlers: {
    onNeedsAuthorizationMessage?: (data: ChildNeedsAuthorizationEvent) => void;
    onResizeMessage?: (data: ChildRequestSizeEvent) => void;
    onCloseMessage?: (data: ChildCloseEvent) => void;
    onCompleteMessage?: (data: ChildCompleteEvent) => void;
    onChildDead?: (reason: string) => void;
    onLoaded?: () => void;
  };
  childOrigin: string;
  childIframe: HTMLIFrameElement;
  healthCheckIntervalMs?: number;
  healthCheckFailuresBeforeDead?: number;
};

export class ParentIframeCommunicator {
  eventHandlers: ParentIframeCommunicatorOptions["eventHandlers"];
  childOrigin: string;
  childIframe: HTMLIFrameElement;
  healthCheckIntervalMs: number;
  healthCheckInterval: ReturnType<typeof setInterval> | undefined;

  // internal state
  // NOTE: This uses some terms from TCP, but it's not a real TCP connection
  healthCheckAckId: number;
  healthCheckSynId: number;
  healthCheckFailuresBeforeDead: number;
  handleChildIframeMessage: (event: MessageEvent<ChildEvent>) => void;
  childViewChanged = false;

  constructor({
    eventHandlers,
    childOrigin,
    childIframe,
    healthCheckIntervalMs = 3000,
    healthCheckFailuresBeforeDead = 3,
  }: ParentIframeCommunicatorOptions) {
    this.eventHandlers = eventHandlers;
    this.childOrigin = childOrigin;
    this.childIframe = childIframe;
    this.healthCheckIntervalMs = healthCheckIntervalMs;
    this.healthCheckFailuresBeforeDead = healthCheckFailuresBeforeDead;

    this.healthCheckAckId = 0;
    this.healthCheckSynId = 0;

    this.handleChildIframeMessage = (event: MessageEvent<ChildEvent>) => {
      if (event.origin !== this.childOrigin) {
        // Ignore messages from other origins
        return;
      }

      try {
        if (event.data.type === ChildEventType.NEEDS_AUTHORIZATION) {
          this.eventHandlers?.onNeedsAuthorizationMessage && this.eventHandlers.onNeedsAuthorizationMessage(event.data);
        } else if (event.data.type === ChildEventType.REQUEST_SIZE) {
          this.eventHandlers?.onResizeMessage && this.eventHandlers.onResizeMessage(event.data);
        } else if (event.data.type === ChildEventType.CLOSE) {
          this.eventHandlers?.onCloseMessage && this.eventHandlers.onCloseMessage(event.data);
        } else if (event.data.type === ChildEventType.COMPLETE) {
          this.eventHandlers?.onCompleteMessage && this.eventHandlers.onCompleteMessage(event.data);
        } else if (event.data.type === ChildEventType.VIEW_CHANGE) {
          this.handleChildViewChange(event.data);
        } else if (event.data.type === ChildEventType.HEALTH_RESPONSE) {
          this.handleHealthResponse(event.data);
        }
      } catch (e) {
        console.error("Error handling child iframe message", e);
      }
    };
  }

  handleHealthResponse(event: ChildHealthResponseEvent) {
    this.healthCheckAckId = Math.max(this.healthCheckAckId, event.payload.id);
  }

  handleChildViewChange(event: ChildViewChangeEvent) {
    if (!this.childViewChanged) {
      this.childViewChanged = true;
      if (this.eventHandlers.onLoaded) {
        this.eventHandlers.onLoaded();
      }
    }
  }

  addListeners() {
    window.addEventListener("message", this.handleChildIframeMessage);
    this.startHealthCheck();
  }

  removeListeners() {
    this.stopHealthCheck();
    window.removeEventListener("message", this.handleChildIframeMessage);
  }

  startHealthCheck() {
    if (this.healthCheckIntervalMs > 0) {
      this.healthCheckInterval = setInterval(() => {
        try {
          if (this.healthCheckSynId - this.healthCheckAckId > this.healthCheckFailuresBeforeDead) {
            this.eventHandlers?.onChildDead && this.eventHandlers.onChildDead("Health check failed");
          } else {
            this.send({
              type: ParentEventType.HEALTH_REQUEST,
              payload: {
                id: this.healthCheckSynId++,
              },
            });
          }
        } catch (e) {
          console.error("Error sending health check", e);
        }
      }, this.healthCheckIntervalMs);
    }
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  send(message: ParentEvent) {
    if (this.childIframe.contentWindow) {
      this.childIframe.contentWindow.postMessage(message, this.childOrigin);
    }
    // TODO: handle the case where the childIframe.contentWindow is null
  }
}

type ChildIframeCommunicatorOptions = {
  onAuthorizationMessage: (data: ParentAuthorizationEvent) => void;
  onCurrentSizeMessage: (data: ParentCurrentSizeEvent) => void;
  parentOrigin: string;
};

export class ChildIframeCommunicator {
  onAuthorizationMessage: ChildIframeCommunicatorOptions["onAuthorizationMessage"];
  onCurrentSizeMessage: ChildIframeCommunicatorOptions["onCurrentSizeMessage"];
  parentOrigin: string;

  // internal state
  handleParentMessage: (event: MessageEvent<ParentEvent>) => void;

  constructor({ onAuthorizationMessage, onCurrentSizeMessage, parentOrigin }: ChildIframeCommunicatorOptions) {
    this.onAuthorizationMessage = onAuthorizationMessage;
    this.onCurrentSizeMessage = onCurrentSizeMessage;
    this.parentOrigin = parentOrigin;

    this.handleParentMessage = (event: MessageEvent<ParentEvent>) => {
      // TODO: Figure out if we can check the origin of the sender
      // if (event.origin !== this.parentOrigin) {
      //   // Ignore messages from other origins
      //   return;
      // }

      try {
        if (event.data.type === ParentEventType.AUTHORIZATION) {
          this.onAuthorizationMessage(event.data);
        } else if (event.data.type === ParentEventType.CURRENT_SIZE) {
          this.onCurrentSizeMessage(event.data);
        } else if (event.data.type === ParentEventType.HEALTH_REQUEST) {
          this.handleHealthRequest(event.data);
        }
      } catch (e) {
        console.error("Error handling parent iframe message", e);
      }
    };
  }
  addListeners() {
    window.addEventListener("message", this.handleParentMessage);
  }
  removeListeners() {
    window.removeEventListener("message", this.handleParentMessage);
  }
  handleHealthRequest(event: ParentHealthRequestEvent) {
    // TODO: Figure out if we want to suppport TTLs. If the child doesn't send back a response,
    // even if TTL is violated, the parent will think the child is dead
    this.send({
      type: ChildEventType.HEALTH_RESPONSE,
      payload: {
        id: event.payload.id,
      },
    });
  }
  send(message: ChildEvent) {
    window.parent.postMessage(message, this.parentOrigin);
  }
}
