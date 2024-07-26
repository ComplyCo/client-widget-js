import { type ViewOptions } from "../types";
import { ComplyCoAPIAuth } from "../../auth";
import IframeManager from "../../iframe/manager";

export type InitializeOptions = ViewOptions & {
  params: { id: string };
};

export function initialize(options: InitializeOptions) {
  const apiAuth = new ComplyCoAPIAuth({
    baseUrl: options.baseUrl,
    onGetAuthToken: options.onAuthTokenRequested,
  });

  const manager = new IframeManager({
    path: `/v1/tasks/${options.params.id}`,
    apiAuth,
    events: {
      onLoad: options.onLoad,
      onStarted: options.onStarted,
      onShutdown: options.onShutdown,
      onResize: options.onResize,
      onComplete: options.onComplete,
      onHeartbeatAge: options.onHeartbeatAge,
    },
  });

  try {
    manager.start(options.iframe);
  } catch (err) {
    if (options.onError) {
      options.onError(err);
    }
  }

  return {
    run: manager.run,
    unmount: () => {
      // TODO: Figure out controller + signals for cancellation
      manager.unmount();
    },
  };
}
