import { Actor, PlaywrightCrawler, RequestQueue } from 'apify';
import * as cheerio from 'cheerio';

export async function crawlGeneric(listUrl, useProxy) {
  const q = await RequestQueue.open();
  await q.addRequest({ url: listUrl });

  const items = [];
  const crawler = new PlaywrightCrawler({
    requestQueue: q,
    useSessionPool: true,
    maxConcurrency: 5,
    proxyConfiguration: useProxy ? await Actor.createProxyConfiguration() : undefined,
    navigationTimeoutSecs: 45,
    async requestHandler({ page, request, enqueueLinks }) {
      await page.waitForLoadState('domcontentloaded');
      const cookieBtn = await page.$('text=Accept') || await page.$('button:has-text("Accept")');
      if (cookieBtn) {
        try { await cookieBtn.click({ timeout: 3000 }); } catch {}
      }

      const url = request.url;
      const jobLinkSelectors = [
        'a[href*="job"]',
        'a[href*="/jobs/"]',
        'a[href*="opening"]',
        'a[href*="position"]',
        'a:has-text("Apply")'
      ];
      if (!/\/job\//i.test(url)) {
        for (const sel of jobLinkSelectors) {
          try {
            await enqueueLinks({ selector: sel, transformRequestFunction: (r) => ({ ...r, userData: { detail: true } }) });
          } catch {}
        }
        return;
      }
      const title = await page.title();
      const content = await page.content();
      const $ = cheerio.load(content);
      const descSel = $('section, article, .description, #job-description, [data-testid*="description"], [class*="description"]').first();
      const descriptionHtml = descSel.length ? $.html(descSel) : $.html('body');
      const text = cheerio.load(descriptionHtml).text().trim();

      const locCandidates = $('*[class*="location"], [data-testid*="location"], li:contains("Location"), p:contains("Location")').first().text().trim();

      items.push({
        title: title?.split('|')[0].trim(),
        locations: locCandidates || undefined,
        applyUrl: url,
        externalUrl: url,
        ats: 'generic',
        sourceUrl: listUrl,
        descriptionHtml,
        descriptionText: text,
      });
    },
  });

  await crawler.run();
  return items;
}