export const dynamic = 'force-dynamic'; // ensure no caching during test

export async function GET() {
  return new Response(JSON.stringify({
    ok: true,
    time: new Date().toISOString()
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  });
}
