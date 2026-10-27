// A small in-memory stand-in for the Admin Firestore surface the evidence store uses:
// collection/doc refs, get, where(==), and runTransaction with get/create/set. Transactions run
// one at a time; `create` refuses an existing document, as Firestore's does.
export function memoryFirestore() {
  const docs = new Map(); // path -> data
  const snap = (path) => ({ exists: docs.has(path), id: path.split('/').pop(), data: () => structuredClone(docs.get(path)) });
  const docRef = (col, id) => ({ path: `${col}/${id}`, id, get: async () => snap(`${col}/${id}`) });
  let queue = Promise.resolve();
  const db = {
    docs,
    collection: (col) => ({
      doc: (id) => docRef(col, id),
      where: (field, op, value) => ({
        get: async () => {
          if (op !== '==') throw new Error('fake supports == only');
          const out = [...docs.keys()].filter((p) => p.startsWith(`${col}/`) && docs.get(p)[field] === value).map(snap);
          return { docs: out, empty: out.length === 0, size: out.length };
        },
      }),
    }),
    runTransaction(fn) {
      const run = queue.then(async () => {
        const writes = [];
        const tx = {
          get: async (ref) => snap(ref.path),
          create: (ref, data) => writes.push(['create', ref.path, data]),
          set: (ref, data) => writes.push(['set', ref.path, data]),
        };
        const result = await fn(tx);
        for (const [kind, path] of writes) {
          if (kind === 'create' && docs.has(path)) throw new Error(`ALREADY_EXISTS: ${path}`);
        }
        for (const [, path, data] of writes) docs.set(path, structuredClone(data));
        return result;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
  return db;
}
