import got from 'got';

export async function scrapeWorkdayFromBase(baseApi, careerSiteUrl) {
  const searchEndpoint = `${baseApi}/fs/searchPagination/318c8bb6f553100021d223d9780d30be`;
  const limit = 50;
  let offset = 0;
  const out = [];
  while (true) {
    const { body } = await got.post(searchEndpoint, {
      json: { limit, offset, searchText: '', appliedFacets: {} },
      responseType: 'json',
    });
    const postings = body.jobPostings || [];
    if (!postings.length) break;
    for (const p of postings) {
      const jobUrl = (careerSiteUrl || '') + (p.externalPath || '');
      out.push({
        title: p.title,
        locations: p.locationsText,
        postedAt: p.postedOn,
        jobId: p.bulletFields?.filter(Boolean).pop() || p.externalPath,
        applyUrl: jobUrl || null,
        externalUrl: jobUrl || null,
        ats: 'workday',
        sourceUrl: searchEndpoint,
      });
    }
    offset += limit;
  }
  return out;
}

export async function scrapeWorkdayByCareerUrl(careerUrl) {
  const url = careerUrl.replace(/\/$/, '');
  if (url.includes('/wday/cxs/')) {
    return scrapeWorkdayFromBase(url, null);
  }
  const m = url.match(/https:\/\/([^.]+)\.wd(\d+)\.myworkdayjobs\.com\/(.+)$/);
  if (m) {
    const [, tenant, wd, rest] = m;
    const parts = rest.split('/');
    const site = parts[0];
    const base = `https://${tenant}.wd${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}`;
    return scrapeWorkdayFromBase(base, url);
  }
  if (url.includes('flipkartcareers.com')) {
    const base = 'https://flipkart.wd3.myworkdayjobs.com/wday/cxs/flipkart/FLIPKART';
    const careerSite = 'https://flipkart.wd3.myworkdayjobs.com/en-US/FLIPKART';
    return scrapeWorkdayFromBase(base, careerSite);
  }
  return [];
}