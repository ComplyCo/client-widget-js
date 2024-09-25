export type AuthConfig = {
  token: string;
  baseUrl: string;
  expiresAtEpochMs: number;
};

export type AuthConfigFn = () => Promise<AuthConfig>;

export type ClientAuthOptions = {
  earlyRefreshMs?: number;
};

export default class ClientAuth {
  #configFn: AuthConfigFn | undefined;
  #options: Required<ClientAuthOptions>;
  #configCache: AuthConfig | undefined;

  constructor(configFn?: AuthConfigFn | undefined, options?: ClientAuthOptions) {
    this.#configFn = configFn;
    this.#options = {
      ...options,
      earlyRefreshMs: options?.earlyRefreshMs && options.earlyRefreshMs >= 0 ? options.earlyRefreshMs : 1000 * 30, // 30 seconds
    };
  }

  setConfigFn(fn: AuthConfigFn) {
    this.#configFn = fn;
  }

  /**
   * Retrieves the configuration, refreshing it if necessary.
   *
   * @returns {Promise<Config>} A promise that resolves to the configuration object.
   * @throws Will throw an error if the configuration cannot be refreshed.
   */
  async config() {
    if (!this.#configCache) {
      await this.#refresh();
    } else {
      if (this.#configCache.expiresAtEpochMs - this.#options.earlyRefreshMs < Date.now()) {
        await this.#refresh();
      }
    }

    if (!this.#configCache) {
      throw new Error("Could not get config. Is the config function set?");
    }

    return this.#configCache;
  }

  // TODO: Rename method to indicate that a request failed and is putting "backpressure"
  // on the cache, telling it to refresh
  async #refresh() {
    if (!this.#configFn) {
      throw new Error("Config function not set");
    }

    this.#configCache = await this.#configFn();
  }

  async refreshIfCurrent(token: string) {
    if (!this.#configCache) {
      await this.#refresh();
      return;
    }

    if (this.#configCache.token === token) {
      await this.#refresh();
      return;
    }
  }
}
