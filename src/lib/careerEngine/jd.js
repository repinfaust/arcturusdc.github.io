// Job-description helpers: turn a pasted job-ad URL into plain-text JD.

export const isUrl = (s) => /^https?:\/\//i.test((s || '').trim());

// Strip HTML tags/entities to readable plain text.
export function htmlToText(html) {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

// Pull a JobPosting description out of a page's JSON-LD blocks, if present.
function extractJobPostingFromJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of blocks) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const candidates = Array.isArray(data) ? data : (data['@graph'] || [data]);
    for (const node of candidates) {
      const type = node && node['@type'];
      const isJob = type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'));
      if (isJob && node.description) {
        const title = node.title ? `${node.title}\n\n` : '';
        const company = node.hiringOrganization?.name ? `Company: ${node.hiringOrganization.name}\n` : '';
        const loc = node.jobLocation?.address?.addressLocality ? `Location: ${node.jobLocation.address.addressLocality}\n` : '';
        const salary = node.baseSalary?.value?.minValue ? `Salary: ${node.baseSalary.value.minValue}-${node.baseSalary.value.maxValue || ''} ${node.baseSalary.currency || ''}\n` : '';
        return htmlToText(`${title}${company}${loc}${salary}\n${node.description}`);
      }
    }
  }
  return null;
}

// Fetch a job-ad URL and return the best plain-text JD we can extract.
// Returns null if the page can't be fetched or yields no usable description.
export async function fetchJdFromUrl(url) {
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();

  // 1) Prefer structured JobPosting JSON-LD (Reed, Indeed, Greenhouse, etc.)
  const fromJsonLd = extractJobPostingFromJsonLd(html);
  if (fromJsonLd && fromJsonLd.length > 200) return fromJsonLd;

  // 2) Fallback: og:description / meta description (short, but better than the URL)
  const meta =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (meta && meta.length > 120) return htmlToText(meta);

  return null;
}
