import got from 'got';

export async function scrapeGreenhouse(company, base = null) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`;
  const { body } = await got(url, { responseType: 'json' });
  const out = (body.jobs || []).map((j) => ({
    title: j.title,
    company: j.company?.name || company,
    locations: j.location?.name,
    department: j.departments?.map((d) => d.name).join(', ') || undefined,
    jobType: j.metadata?.find(m => m.name === 'Employment Type')?.value,
    postedAt: j.updated_at || j.created_at,
    jobId: j.id,
    applyUrl: j.absolute_url,
    externalUrl: j.absolute_url,
    descriptionHtml: j.content,
    ats: 'greenhouse',
    sourceUrl: base || url,
  }));
  return out;
}

export function guessCompanySlugForGreenhouse(url) {
  const map = new Map([
    ['shopify.com', 'shopify'],
    ['careers.etsy.com', 'etsy'],
    ['aboutwayfair.com', 'wayfair'],
    ['poshmark.com', 'poshmark'],
    ['instacart.careers', 'instacart'],
    ['careers.hellofresh.com', 'hellofresh'],
    ['jobs.zalando.com', 'zalando'],
    ['careers.olx.in', 'olxgroup'],
    ['joor.com', 'joor'],
    ['spinny.com', 'spinny'],
    ['myntra.com', 'myntra'],
    ['swiggy.com', 'swiggy'],
    ['blinkit.com', 'blinkit'],
  ]);
  for (const [host, slug] of map.entries()) {
    if (url.includes(host)) return slug;
  }
  return null;
}