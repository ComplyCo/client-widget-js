export type Plugin = {
  name: string;
  beforeSend?: (req: RequestHeadersAndBody) => RequestHeadersAndBody;
};

export type RequestHeadersAndBody = {
  method: string;
  headers: Record<string, string>;
  body: string | Uint8Array;
};

// TODO: See if we can make this a shared type
export type AuthTokenRequestFn = (options: { signal?: AbortSignal }) =>
  | Promise<
      | {
          token: string;
        }
      | undefined
    >
  | undefined;
