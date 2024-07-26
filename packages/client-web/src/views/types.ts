import { type IframeManagerOptions } from "../iframe/manager";
import { type ComplyCoAPIAuthOptions } from "../auth";

export type ViewOptions = Pick<
  IframeManagerOptions["events"],
  "onLoad" | "onStarted" | "onShutdown" | "onComplete" | "onResize" | "onHeartbeatAge"
> & {
  baseUrl: string;
  onAuthTokenRequested: ComplyCoAPIAuthOptions["onGetAuthToken"];
  onError?: (error: any) => void;
  iframe?: HTMLIFrameElement | undefined | null;
};

// TODO: Add a function to validate the view options
