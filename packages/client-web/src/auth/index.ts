type SessionAliveResponseBody = {
  message: string;
  data: {
    nonce?: string;
  };
};

function generateSecureRandomString(length: number) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(array[i] % charactersLength);
  }
  return result;
}

type ComplyCoAPIAuthOptions = {
  baseUrl: string;
  clientId: string;
  onGetChallenge: (options: {
    signal?: AbortSignal;
    nonce: string;
  }) => Promise<{ challenge: string } | undefined> | undefined;
};

export class ComplyCoAPIAuth {
  baseUrl: string;
  clientId: string;
  onGetChallenge: ComplyCoAPIAuthOptions["onGetChallenge"];
  // Private
  uuid: string;

  constructor({ baseUrl, onGetChallenge, clientId }: ComplyCoAPIAuthOptions) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.onGetChallenge = onGetChallenge;
    this.uuid = generateSecureRandomString(24);
  }

  clientUrl(route: string) {
    return `${this.baseUrl}${route}?clientId=${this.clientId}`;
  }

  async checkAuth({ signal }: { signal: AbortSignal }) {
    const resp = await fetch(`${this.baseUrl}/api/v1/sessions/alive?clientId=${this.clientId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Preflight-Force": "1",
      },
      body: JSON.stringify({
        uuid: this.uuid,
      }),
      signal,
    });

    if (resp.status === 201) {
      const json: SessionAliveResponseBody = await resp.json();
      const nonce = json.data.nonce;
      // NOTE: Nonce should be set in this case.
      // Start exchange
      if (!nonce) {
        throw new Error("Nonce not found");
      }
      let challengeResp: { challenge: string } | undefined;
      try {
        challengeResp = await this.onGetChallenge({ signal, nonce });
      } catch (e) {
        console.error(e);
      }

      if (!challengeResp) {
        throw new Error("Challenge not found");
      }

      const resp2 = await fetch(`${this.baseUrl}/api/v1/sessions/obtain?clientId=${this.clientId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Preflight-Force": "1",
        },
        body: JSON.stringify({
          challenge: challengeResp.challenge,
          nonce,
          uuid: this.uuid,
        }),
        signal,
      });

      if (resp2.status === 201) {
        // Session is alive
        return;
      } else {
        // Session is not alive
        throw new Error("Session is not alive");
      }
    } else if (resp.status === 304) {
      // Session is alive
      return;
    } else if (resp.status === 409) {
      // Session is not alive, conflict - another tab is in flight, maybe retry with backoff
      throw new Error("Session is not alive");
    } else {
      // Session is not alive
      throw new Error("Session is not alive");
    }
  }
}
