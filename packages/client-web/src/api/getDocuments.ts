import { complycoApiRequest, type UseValidAuth} from "@complyco/client-core";
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
  getApiConfig,
  signal,
}: {
  ids: string[];
  getApiConfig: UseValidAuth;
  signal?: AbortSignal;
}) {
  const response = await complycoApiRequest(getApiConfig, `/api/v1/documents`);
  return response.data;
}
