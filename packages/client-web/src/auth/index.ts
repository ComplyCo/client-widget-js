type ComplyCoAPIAuthOptions = {
  baseUrl: string;
  onGetAuthToken: (options: { signal?: AbortSignal }) => Promise<{ token: string } | undefined> | undefined;
};

export class ComplyCoAPIAuth {
  baseUrl: string;
  onGetAuthToken: ComplyCoAPIAuthOptions["onGetAuthToken"];
  // private
  getAuthPromise: ReturnType<ComplyCoAPIAuthOptions["onGetAuthToken"]> | undefined;

  constructor({ baseUrl, onGetAuthToken }: ComplyCoAPIAuthOptions) {
    this.baseUrl = baseUrl;
    this.onGetAuthToken = onGetAuthToken;
  }

  clientUrl(route: string) {
    return `${this.baseUrl}${route}`;
  }

  async checkAuth({ signal }: { signal?: AbortSignal }) {
    if (!this.getAuthPromise) {
      this.getAuthPromise = this.onGetAuthToken({ signal });
    }
    return await this.getAuthPromise;
  }

  async authHeaders({ signal }: { signal?: AbortSignal }) {
    if (!this.getAuthPromise) {
      this.getAuthPromise = this.onGetAuthToken({ signal });
    }
    const res = await this.getAuthPromise;
    if (!res?.token) {
      throw new Error("Failed to get auth token");
    }
    return {
      "X-Preflight-Force": "1",
      Authorization: `Bearer ${res.token}`,
    };
  }
}
