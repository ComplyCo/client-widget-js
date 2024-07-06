import { type ComplyCoAPIAuth } from "../auth";
import type { ConsentMachine } from "./types";

export type GetDocumentsResponseBodyDocument = {
  id: string;
  consent: {
    id: string;
    name: string;
    consent_machine: ConsentMachine;
  };
};

export type GetDocumentsResponseBody = {
  message: string;
  data: {
    documents: Record<string, GetDocumentsResponseBodyDocument>;
  };
};

export async function getDocuments({
  ids,
  auth,
  signal,
}: {
  ids: string[];
  auth: ComplyCoAPIAuth;
  signal?: AbortSignal;
}) {
  const headers = await auth.authHeaders({ signal });

  const resp = await fetch(auth.clientUrl("/api/v1/documents"), {
    method: "POST",
    credentials: "include",
    headers: headers,
    signal,
    body: JSON.stringify({ ids }),
  });

  if (!resp.ok) {
    throw new Error("Failed to get documents");
  }
  const json = (await resp.json()) as GetDocumentsResponseBody;
  return json;
}
