import { readFileSync } from 'node:fs';
import path from 'node:path';

export function GET() {
  const html = readFileSync(path.join(process.cwd(), 'src/app/apps/returno-companion/privacy-policy/privacy-policy.html'), 'utf8');
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
}
