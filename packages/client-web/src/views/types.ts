import { type IframeManagerOptions } from "../iframe/manager";
import { type ComplyCoAPIAuthOptions } from "../auth";

export type ViewOptions = Pick<IframeManagerOptions["events"], "onLoad" | "onShutdown" | "onResize"> & {
  baseUrl: string;
  onAuthTokenRequested: ComplyCoAPIAuthOptions["onGetAuthToken"];
  onError?: (error: any) => void;
};

// TODO: Add a function to validate the view options
