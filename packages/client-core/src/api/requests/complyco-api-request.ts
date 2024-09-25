import { IApiResponse } from "../types/i-api-response";
import { type UseValidAuth } from "../../auth/hooks";

const isBaseUrlValid = (baseUrl: string) => {
  if (!baseUrl) {
    return false;
  }

  if (
    baseUrl.endsWith(".client.complyco.com/") ||
    baseUrl.endsWith(".client.complyco.com") ||
    baseUrl.endsWith(".client-qa.complyco.com/") ||
    baseUrl.endsWith(".client-qa.complyco.com") ||
    baseUrl.endsWith(".local/") ||
    baseUrl.endsWith(".local")
  ) {
    return true;
  }

  return false;
};

export async function complycoApiRequest<T>(
  getApiConfig: UseValidAuth,
  endpoint: string,
  body?: any,
  isRetry?: boolean
): Promise<IApiResponse<T>> {
  try {
    const { token, baseUrl } = await getApiConfig.getAuth();
    if (!isBaseUrlValid(baseUrl)) {
      throw new Error("Invalid baseUrl: " + baseUrl);
    }

    let formattedEndpoint = endpoint;
    if (baseUrl.endsWith("/") && endpoint.startsWith("/")) {
      formattedEndpoint = endpoint.slice(1);
    } else if (!baseUrl.endsWith("/") && !endpoint.startsWith("/")) {
      formattedEndpoint = `/${endpoint}`;
    }

    const response = await fetch(`${baseUrl}${formattedEndpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body && JSON.stringify(body),
    });

    if (response.ok) {
      const json = await response.json();
      return json as IApiResponse<T>;
    }

    if (!isRetry) {
      // TODO: Make the client backend return a message indicating the token is expired
      // NOTE: There could be many reasons for a 401, not just an expired token
      if (response.status === 401) {
        await getApiConfig.tokenExpired(token);
        return complycoApiRequest(getApiConfig, endpoint, body, true);
      }
    }

    throw new Error(
      "Error in request " + endpoint + ": " + response.statusText
    );
  } catch (err) {
    console.error("Error in request: ", err);
    throw err;
  }
}
