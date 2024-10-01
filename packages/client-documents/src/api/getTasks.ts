import { type ComplyCoAPIAuth } from "../auth";
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

export async function getTasks({ auth, signal }: { auth: ComplyCoAPIAuth; signal?: AbortSignal }) {
  const headers = await auth.authHeaders({ signal });

  const resp = await fetch(auth.clientUrl("/api/v1/tasks"), {
    method: "POST",
    credentials: "include",
    headers: headers,
    signal,
  });

  if (!resp.ok) {
    throw new Error("Failed to get tasks");
  }
  const json = (await resp.json()) as GetTasksResponseBody;
  return json;
}
