import { Actor, log, PlaywrightCrawler, Dataset, RequestQueue } from 'apify';
import got from 'got';
import * as cheerio from 'cheerio';
import normalizeUrl from 'normalize-url';

import { scrapeGreenhouse, guessCompanySlugForGreenhouse } from './adapters/greenhouse.js';
import { scrapeLever, guessCompanySlugForLever } from './adapters/lever.js';
import { scrapeSmartRecruiters } from './adapters/smartrecruiters.js';
import { scrapeWorkdayByCareerUrl } from './adapters/workday.js';
import { scrapeDarwinbox } from './adapters/darwinbox.js';
import { crawlGeneric } from './adapters/generic-playwright.js';

function normalizeJob(job) {
  const now = new Date().toISOString();
  return {
    title: job.title || null,
    company: job.company || null,
    locations: job.locations || job.location || null,
    city: job.city || null,
    state: job.state || null,
    country: job.country || null,
    remote: job.remote ?? null,
    jobType: job.jobType || job.employmentType || null,
    department: job.department || null,
    category: job.category || null,
    experienceLevel: job.experienceLevel || null,
    postedAt: job.postedAt || job.datePosted || null,
    updatedAt: job.updatedAt || null,
    jobId: job.jobId || job.requisitionId || job.reqId || null,
    requisitionId: job.requisitionId || null,
    applyUrl: job.applyUrl || job.url || job.jobUrl || null,
    externalUrl: job.externalUrl || null,
    descriptionHtml: job.descriptionHtml || null,
    descriptionText: job.descriptionText || (job.descriptionHtml ? cheerio.load(job.descriptionHtml).text() : null),
    responsibilities: job.responsibilities || null,
    requirements: job.requirements || null,
    benefits: job.benefits || null,
    salary: job.salary || null,
    currency: job.currency || null,
    ats: job.ats || null,
    sourceUrl: job.sourceUrl || null,
    source: job.source || null,
    scrapedAt: now,
  };
}

// Detection helpers
function detectProviderFromHtml(html, url) {
  const u = url.toLowerCase();
  if (u.includes('myworkdayjobs.com') || /wday\/cxs\//i.test(u)) return 'workday';
  if (/greenhouse\.io|boards-api\.greenhouse\.io/i.test(html) || /greenhouse/i.test(u)) return 'greenhouse';
  if (/jobs\.lever\.co/i.test(html) || /lever\.co/i.test(u)) return 'lever';
  if (/api\.smartrecruiters\.com|careers\.smartrecruiters\.com/i.test(html) || /smartrecruiters/i.test(u)) return 'smartrecruiters';
  if (/darwinbox\.in\//i.test(u)) return 'darwinbox';
  if (/oraclecloud\.com\/hcmui\/candidateexperience/i.test(u)) return 'oracle';
  return 'generic';
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

await Actor.init();
const input = await Actor.getInput();
const { startUrls = [], useApifyProxy = true } = input || {};

const all = [];

for (const { url } of startUrls) {
  try {
    const normalized = normalizeUrl(url, { removeTrailingSlash: false });
    log.info(`Processing: ${normalized}`);
    const { body: html } = await got(normalized, { timeout: { request: 20000 } }).catch(() => ({ body: '' }));
    const provider = detectProviderFromHtml(html || '', normalized);

    if (provider === 'workday') {
      const jobs = await scrapeWorkdayByCareerUrl(normalized);
      jobs.forEach((j) => all.push(normalizeJob(j)));
      continue;
    }

    if (provider === 'greenhouse') {
      const slug = guessCompanySlugForGreenhouse(normalized);
      if (slug) {
        const jobs = await scrapeGreenhouse(slug, normalized);
        jobs.forEach((j) => all.push(normalizeJob(j)));
        continue;
      }
    }

    if (provider === 'lever') {
      const slug = guessCompanySlugForLever(normalized);
      if (slug) {
        const jobs = await scrapeLever(slug, normalized);
        jobs.forEach((j) => all.push(normalizeJob(j)));
        continue;
      }
    }

    if (provider === 'smartrecruiters') {
      const host = new URL(normalized).hostname;
      const company = host.split('.')[0];
      try {
        const jobs = await scrapeSmartRecruiters(company, normalized);
        jobs.forEach((j) => all.push(normalizeJob(j)));
        continue;
      } catch (e) {
        log.warning(`SmartRecruiters failed for ${normalized}: ${e.message}`);
      }
    }

    if (provider === 'darwinbox') {
      const jobs = await scrapeDarwinbox(normalized);
      jobs.forEach((j) => all.push(normalizeJob(j)));
      continue;
    }

    if (provider === 'oracle') {
      const jobs = await crawlGeneric(normalized, useApifyProxy);
      jobs.forEach((j) => all.push(normalizeJob(j)));
      continue;
    }

    const jobs = await crawlGeneric(normalized, useApifyProxy);
    jobs.forEach((j) => all.push(normalizeJob(j)));
  } catch (err) {
    log.exception(err, `Failed on ${url}`);
  }
}

for (const chunk of chunkArray(all, 100)) {
  await Dataset.pushData(chunk);
}

log.info(`Scraped total jobs: ${all.length}`);
await Actor.exit();