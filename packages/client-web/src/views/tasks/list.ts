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
      onShutdown: options.onShutdown,
      onResize: options.onResize,
      onComplete: options.onComplete,
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
          return manager.run();
        }
      })
      .catch((err) => {
        if (options.onError) {
          options.onError(err);
        }
      });
  } else {
    try {
      manager.run();
    } catch (err) {
      if (options.onError) {
        options.onError(err);
      }
    }
  }

  return {
    unmount: () => {
      // TODO: Figure out controller + signals for cancellation
      manager.unmount();
    },
  };
}
