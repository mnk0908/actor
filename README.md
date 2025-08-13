# Multi-ATS Career Page Scraper (Apify Actor)

Scrapes **all jobs with full details & links** from a mixed list of company career pages across **Workday, Greenhouse, Lever, SmartRecruiters, Darwinbox, Oracle Cloud HCM**, and **custom sites** using a robust fallback crawler.

## What you get
- Unified job schema (title, locations, type, IDs, posted date, apply URL, description HTML/text, etc.)
- Vendor-specific API integrations for **Workday, Greenhouse, Lever, SmartRecruiters**
- Fallback **Playwright** crawler for dynamic/custom pages
- Ready **prefilled list** with your provided URLs

## Setup (on Apify)
1. Create a new actor → **Import** these files.
2. Ensure **Dockerfile**, **actor.json**, **package.json**, **INPUT_SCHEMA.json**, **main.js** exist.
3. Click **Build**.
4. Run with default input (prefilled URLs). Toggle **Use Apify Proxy** if needed.

## Notes & Tips
- For Workday sites that aren’t in `*.myworkdayjobs.com` format, the actor attempts to derive the `wday/cxs` API automatically (Flipkart supported out of the box).
- Greenhouse/Lever slugs are **auto-guessed** for common brands. If a site isn’t captured, add a mapping in `guessCompanySlugForGreenhouse/Lever` or provide the direct ATS URL in `startUrls`.
- Some sites (Oracle HCM, Phenom, SuccessFactors, SenseHQ, TalentRecruit, etc.) can have **anti-bot protections** or deeply dynamic flows. The generic crawler will still try to open each job detail and extract title, location, and full description. If you need stronger coverage for a specific vendor, add a dedicated adapter like the ones shown.
- Increase reliability with **Apify Proxy** and reasonable **max concurrency**.

## Output
Data is stored in the default dataset. Export as **JSON/CSV/Excel** from the run.

## Extending Adapters
- Add a new `scrapeXxx()` function following the adapter pattern.
- Detect the provider in `detectProviderFromHtml()`.
- Optionally add a slug guesser for company domains.

## Disclaimer
Websites change frequently. If a target page changes its structure or adds new bot protections, adaptors may require updates. Always respect each site's Terms of Service.