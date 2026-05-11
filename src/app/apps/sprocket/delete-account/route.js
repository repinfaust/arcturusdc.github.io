import { readFileSync } from 'node:fs';
import path from 'node:path';

export function GET() {
  const filePath = path.join(
    process.cwd(),
    'src/app/apps/sprocket/delete-account/delete-account.html'
  );
  const html = readFileSync(filePath, 'utf8');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
