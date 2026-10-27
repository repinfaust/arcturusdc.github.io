import { state } from './state.mjs';
export async function verifySession() {
  return state.session;
}
