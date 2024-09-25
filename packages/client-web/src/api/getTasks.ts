import { complycoApiRequest, type UseValidAuth} from "@complyco/client-core";
import type { ConsentMachine } from "./types";

export type GetTasksResponseBodyTask = {
  id: string;
  expires_at: string | undefined;
  document_consent: {
    id: string;
    name: string;
    view_url: string;
    consent_machine: ConsentMachine;
  };
};

export type GetTasksResponseBody = {
  message: string;
  data: {
    tasks: GetTasksResponseBodyTask[];
  };
};

export async function getTasks({ getApiConfig }: { getApiConfig: UseValidAuth }) {
  const response = await complycoApiRequest(getApiConfig, `/api/v1/tasks`);
  return response.data;
}
