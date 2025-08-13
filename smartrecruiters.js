import got from 'got';

export async function scrapeSmartRecruiters(company, base = null) {
  const baseUrl = `https://api.smartrecruiters.com/v1/companies/${company}/postings`;
  let next = baseUrl;
  const results = [];
  while (next) {
    const { body } = await got(next, { responseType: 'json' });
    for (const p of body.content || []) {
      results.push({
        title: p.name,
        company,
        locations: p.location?.city ? `${p.location.city}, ${p.location.country}` : p.location?.country,
        jobType: p.type || undefined,
        postedAt: p.releasedDate || p.releasedDateStart,
        jobId: p.id,
        applyUrl: p.applyUrl,
        externalUrl: p.ref || p.applyUrl,
        ats: 'smartrecruiters',
        sourceUrl: base || baseUrl,
      });
    }
    next = body.nextPage || null;
  }
  return results;
}