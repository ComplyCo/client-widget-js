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
  server_sync_states: string[]; // TODO: make this StateType[]
  terminal_states: string[];
};
