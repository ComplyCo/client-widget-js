import { type ViewOptions } from "../types";
import { ComplyCoAPIAuth } from "../../auth";
import IframeManager from "../../iframe/manager";

export type InitializeOptions = ViewOptions & {
  showEmpty?: boolean;
};

export function initialize(options: InitializeOptions) {
  const apiAuth = new ComplyCoAPIAuth({
    baseUrl: options.baseUrl,
    onGetAuthToken: options.onAuthTokenRequested,
  });

  const manager = new IframeManager({
    path: "/v1/overview",
    apiAuth,
    iframe: options.iframe,
    events: {
      onLoad: options.onLoad,
      onShutdown: options.onShutdown,
      onResize: options.onResize,
      onComplete: options.onComplete,
      onHeartbeatAge: options.onHeartbeatAge,
    },
  });

  try {
    manager.run();
  } catch (err) {
    if (options.onError) {
      options.onError(err);
    }
  }

  return {
    unmount: () => {
      // TODO: Figure out controller + signals for cancellation
      manager.unmount();
    },
  };
}
