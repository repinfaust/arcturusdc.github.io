// Shared state the tests set and read.
export const state = globalThis.__orbitFake ??= { reset() {} };
state.reset = () => {
  state.session = { authenticated: false };
  state.orgs = [];
  state.upserts = [];
  state.deleted = [];
  state.reads = [];
};
state.reset();
