export const DataRoleTag = "data-complyco-role";

export const ActionRole = Object.freeze({
  [DataRoleTag]: "action",
});

export const PredicateRole = Object.freeze({
  [DataRoleTag]: "predicate",
});

export const DisclosureRole = Object.freeze({
  [DataRoleTag]: "disclosure",
});

// TODO: decide if we want a document role to exist, or if it should be a resource or something else
export const DocumentRole = Object.freeze({
  [DataRoleTag]: "document",
});
