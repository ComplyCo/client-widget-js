import { type ComplyCoAPIAuth } from "../auth";

export enum StateType {
  Initial = "initial",
  Loaded = "loaded",
  Accepted = "accepted",
  Rejected = "rejected",
  Signed = "signed",
  Scrolled = "scrolled",
}

export enum ActionType {
  Load = "load",
  ScrollToBottom = "scroll_to_bottom",
  Sign = "sign",
  Accept = "accept",
  Reject = "reject",
  Reset = "reset",
}

export type ConsentMachineState = {
  on: Record<ActionType, { target: StateType }>;
};

export type ConsentMachineDefinition = {
  initial: string;
  states: Record<StateType, ConsentMachineState>;
};

export type ConsentMachine = {
  definition: ConsentMachineDefinition;
  server_sync_states: string[];
  terminal_states: string[];
};

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
  const resp = await fetch(auth.clientUrl("/api/v1/tasks"), {
    method: "POST",
    credentials: "include",
    headers: {
      "X-Preflight-Force": "1",
    },
    signal,
  });

  if (!resp.ok) {
    throw new Error("Failed to get tasks");
  }
  const json = (await resp.json()) as GetTasksResponseBody;
  return json;
}
