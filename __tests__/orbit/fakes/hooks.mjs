const FAKES = new URL('./', import.meta.url);
const SRC = new URL('../../../src/', import.meta.url);
const SWAP = {
  'next/server': 'next-server.mjs',
  'firebase-admin/firestore': 'firestore.mjs',
  '@/lib/firebaseAdmin': 'firebaseAdmin.mjs',
  '@/lib/orbit/db-admin': 'db-admin.mjs',
  '@/lib/orbit/auth': 'auth.mjs',
};

export async function resolve(specifier, context, next) {
  if (SWAP[specifier]) return { url: new URL(SWAP[specifier], FAKES).href, shortCircuit: true };
  if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), SRC).href;
  try {
    return await next(specifier, context);
  } catch (e) {
    if (/\.[mc]?js$/.test(specifier)) throw e;
    return next(specifier + '.js', context);
  }
}
