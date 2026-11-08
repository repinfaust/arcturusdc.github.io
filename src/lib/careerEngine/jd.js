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

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Extract a numeric LinkedIn job ID from any LinkedIn job URL:
//   - https://www.linkedin.com/jobs/view/senior-product-manager-at-acme-4478920345
//   - https://www.linkedin.com/jobs/view/4478920345/
//   - https://www.linkedin.com/jobs/search/?currentJobId=4478920345&keywords=...
export function extractLinkedInJobId(url) {
  if (!url || typeof url !== 'string' || !/linkedin\.com/i.test(url)) return null;
  const currentId = url.match(/[?&]currentJobId=(\d{7,15})/i)?.[1];
  if (currentId) return currentId;
  const viewId =
    url.match(/\/jobs\/view\/(?:[^/?#]*?-)?(\d{7,15})(?:[/?#]|$)/i)?.[1] ||
    url.match(/jobPosting:(\d{7,15})/i)?.[1];
  return viewId || null;
}

// Fetch the full public job posting from LinkedIn's unauthenticated jobs-guest API.
export async function fetchLinkedInJobDetail(jobId) {
  if (!jobId) return null;
  try {
    const res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const title = htmlToText(
      html.match(/<h2[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || ''
    );
    const company = htmlToText(
      html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ||
        html.match(/<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
        ''
    );
    const location = htmlToText(
      html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || ''
    );
    const markup =
      html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
      html.match(/<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1] ||
      '';
    const description = htmlToText(markup);
    if (!description || description.length < 100) return null;
    const header = [
      title ? `Role: ${title}` : '',
      company ? `Company: ${company}` : '',
      location ? `Location: ${location}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    return {
      jobId: String(jobId),
      title: title || 'Untitled role',
      company: company || 'Unknown company',
      location: location || '',
      url: `https://www.linkedin.com/jobs/view/${jobId}`,
      description,
      fullText: header ? `${header}\n\n${description}` : description,
    };
  } catch {
    return null;
  }
}

// Search LinkedIn's public jobs-guest endpoint and return structured job cards.
// Also accepts a pasted `linkedin.com/jobs/search/?...` URL (`searchUrl`) to
// preserve any custom filters (`keywords`, `location`, `f_WT`, `f_TPR`).
export async function searchLinkedInGuest({
  keywords = '',
  location = 'United Kingdom',
  remoteOnly = false,
  searchUrl = '',
  start = 0,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (searchUrl && /linkedin\.com\/jobs\/search/i.test(searchUrl)) {
      try {
        const u = new URL(searchUrl);
        for (const [k, v] of u.searchParams.entries()) {
          if (['keywords', 'location', 'f_WT', 'f_TPR', 'f_E', 'f_JT', 'geoId', 'distance'].includes(k) && v) {
            params.set(k, v);
          }
        }
      } catch {}
    }
    if (!params.get('keywords') && keywords) params.set('keywords', keywords);
    if (!params.get('location')) params.set('location', location || 'United Kingdom');
    if (remoteOnly && !params.get('f_WT')) params.set('f_WT', '2');
    if (!params.get('f_TPR')) params.set('f_TPR', 'r604800'); // past 7 days by default
    params.set('start', String(start));

    const res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const cards = html.split(/<li>/i).slice(1);
    const out = [];
    for (const c of cards) {
      const jobId = c.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/i)?.[1];
      if (!jobId) continue;
      const title = htmlToText(
        c.match(/class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || ''
      );
      const company = htmlToText(
        c.match(/class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i)?.[1] || ''
      );
      const loc = htmlToText(
        c.match(/class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || ''
      );
      const listedAt = c.match(/<time[^>]*datetime="([^"]+)"/i)?.[1] || '';
      if (!title) continue;
      out.push({
        source: 'LinkedIn',
        jobId,
        title,
        company,
        location: loc,
        salary: '',
        listedAt,
        url: `https://www.linkedin.com/jobs/view/${jobId}`,
        description: `${title} at ${company}${loc ? ` (${loc})` : ''}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}

// Fetch a job-ad URL and return the best plain-text JD we can extract.
// Returns null if the page can't be fetched or yields no usable description.
export async function fetchJdFromUrl(url) {
  // 0) LinkedIn job posting or search URL with currentJobId -> use jobs-guest API
  const linkedInId = extractLinkedInJobId(url);
  if (linkedInId) {
    const detail = await fetchLinkedInJobDetail(linkedInId);
    if (detail?.fullText) return detail.fullText;
  }

  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
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
