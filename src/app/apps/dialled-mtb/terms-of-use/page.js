import { readFileSync } from 'node:fs';

export const metadata = {
  title: 'Dialled MTB — Terms of Use',
  description: 'Dialled MTB terms of use.',
};

export default function PolicyPage() {
  const html = readFileSync(new URL('./terms-of-use.html', import.meta.url), 'utf8');
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;

  return <div dangerouslySetInnerHTML={{ __html: `<style>${style}</style>${body}` }} />;
}
