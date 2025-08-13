import got from 'got';
import * as cheerio from 'cheerio';

export async function scrapeDarwinbox(listUrl) {
  const { body: html } = await got(listUrl);
  const $ = cheerio.load(html);
  const jobs = [];
  $('a').each((_, a) => {
    const href = $(a).attr('href') || '';
    const text = $(a).text().trim();
    if (/job|opening|position|apply/i.test(text) || /job/i.test(href)) {
      try {
        const url = new URL(href, listUrl).toString();
        jobs.push({
          title: text || undefined,
          applyUrl: url,
          externalUrl: url,
          ats: 'darwinbox',
          sourceUrl: listUrl,
        });
      } catch {}
    }
  });
  return jobs;
}