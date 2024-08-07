import { type ViewOptions } from "../types";
import { ComplyCoAPIAuth } from "../../auth";
import IframeManager from "../../iframe/manager";
import { getTasks } from "../../api/getTasks";

export type InitializeOptions = ViewOptions & {
  showEmpty?: boolean;
};

export function initialize(options: InitializeOptions) {
  const apiAuth = new ComplyCoAPIAuth({
    baseUrl: options.baseUrl,
    onGetAuthToken: options.onAuthTokenRequested,
  });

  const manager = new IframeManager({
    path: "/v1/tasks",
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

  if (!options.showEmpty) {
    // NOTE: We don't boot the iframe if there are no tasks
    apiAuth
      .checkAuth({})
      .then((res) => {
        if (res?.token) {
          return getTasks({ auth: apiAuth });
        }
      })
      .then((json) => {
        if (json && json.data.tasks.length > 0) {
          return manager.start(options.iframe);
        }
      })
      .catch((err) => {
        if (options.onError) {
          options.onError(err);
        }
      });
  } else {
    try {
      manager.start(options.iframe);
    } catch (err) {
      if (options.onError) {
        options.onError(err);
      }
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
