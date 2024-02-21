import { ParentIframeCommunicator, ParentEventType } from "../iframe/communicator";
import { type ComplyCoAPIAuth } from "../auth";
import { getTasks } from "../api/getTasks";

// TODO: document the consent security policy for the widget

// TODO: Figure out if we can load the iframe off-screen and only show it when it's ready
function loadIframe({
  apiAuth,
  onIframeMount,
  onSizeChange,
  onClose: passedOnClose,
}: {
  apiAuth: ComplyCoAPIAuth;
  onIframeMount?: ({ iframe }: { iframe: HTMLIFrameElement }) => void;
  onSizeChange?: ({ size }: { size: "small" | "large" }) => void;
  onClose?: () => void;
}) {
  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.display = "none";

  iframe.src = apiAuth.clientUrl("/tasks");

  let communicator: ParentIframeCommunicator | undefined;
  const onClose = (event?: any) => {
    communicator?.removeListeners();
    if (passedOnClose) {
      passedOnClose();
    }
  };

  communicator = new ParentIframeCommunicator({
    eventHandlers: {
      // TODO: add onNeedsAuthorizationMessage support
      onNeedsAuthorizationMessage: async (data) => {
        const res = await apiAuth.checkAuth({});

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
        if (onSizeChange) {
          onSizeChange({ size: data.payload.size });
        }
      },
      onCloseMessage: (data) => {
        onClose(data);
      },
      onChildDead: (reason: string) => {
        onClose(reason);
      },
      onLoaded: () => {
        if (onIframeMount) {
          // NOTE: we expect the onIframeMount callback to add the iframe to the right location in the DOM
          onIframeMount({ iframe });
          iframe.style.display = "initial";
        }
      },
    },
    healthCheckIntervalMs: 100,
    healthCheckFailuresBeforeDead: 15,
    childIframe: iframe,
    childOrigin: apiAuth.baseUrl,
  });

  // TODO: If we don't get the loaded event in a reasonable amount of time, we should close the iframe (or make it configurable)
  // TODO: decide if we want to rename this event "require_auth" or "auth_required", we probably still want the loaded event
  // TODO: Add a resize event so the iframe can request a resize. This will be dependent on the viewport dimensions

  communicator.addListeners();

  const onUnmount = () => {
    communicator?.removeListeners();
    // TODO: Figure out if we need to clear out the iframe and communicator
  };

  // TODO: Decide if we need to handle iframe.onload
  iframe.onerror = () => {
    onUnmount();
  };

  // We need to add the iframe to the DOM to start it loading
  document.body.appendChild(iframe);

  return {
    unmount: onUnmount,
  };
}

type InitializeOptions = {
  apiAuth: ComplyCoAPIAuth;
  signal: AbortSignal;
  onIframeMount?: ({ iframe }: { iframe: HTMLIFrameElement }) => void;
  onSizeChange?: ({ size }: { size: "small" | "large" }) => void;
  onClose?: () => void;
};

export async function initialize({ apiAuth, signal, onIframeMount, onSizeChange, onClose }: InitializeOptions) {
  // NOTE: We may not want to throw as that could break a developer's app.
  if (!apiAuth) {
    throw new Error("apiAuth is required");
  }

  let iframe: ReturnType<typeof loadIframe> | undefined;

  let authed = false;
  try {
    await apiAuth.checkAuth({ signal });
    authed = true;
  } catch (err) {
    // TODO: Log the error
  }

  if (!authed) {
    // TODO: Figure out what we need to log in this case
    return;
  }

  try {
    const json = await getTasks({ auth: apiAuth, signal });
    if (signal.aborted) {
      return;
    }

    if (json && json.data.tasks.length > 0) {
      iframe = loadIframe({ apiAuth, onIframeMount, onSizeChange, onClose });
    }
  } catch (err) {
    console.error("Failed to get tasks", err);
  }

  return {
    unmount: () => {
      iframe?.unmount();
    },
  };
}
