import { state } from './state.mjs';
const db = {
  collection: (name) => ({
    where: () => ({ get: async () => ({ docs: [{ ref: { name } }] }) }),
  }),
  batch: () => ({ delete: (ref) => state.deleted.push(ref.name), commit: async () => {} }),
};
export function getFirebaseAdmin() {
  return { db, auth: null, app: null, FieldValue: {} };
}
