import got from 'got';

export async function scrapeLever(company, base = null) {
  const url = `https://jobs.lever.co/${company}?mode=json`;
  const { body } = await got(url, { responseType: 'json' });
  const out = (body || []).map((j) => ({
    title: j.text,
    company,
    locations: j.categories?.location,
    department: j.categories?.team,
    jobType: j.categories?.commitment,
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
    jobId: j.id,
    applyUrl: j.hostedUrl,
    externalUrl: j.hostedUrl,
    descriptionHtml: (j.lists || []).map(l => `<h4>${l.text}</h4><ul>${l.content}</ul>`).join('') || undefined,
    ats: 'lever',
    sourceUrl: base || url,
  }));
  return out;
}

export function guessCompanySlugForLever(url) {
  const map = new Map([
    ['zetwerk.com', 'zetwerk'],
    ['jumbotail.com', 'jumbotail'],
  ]);
  for (const [host, slug] of map.entries()) {
    if (url.includes(host)) return slug;
  }
  return null;
}