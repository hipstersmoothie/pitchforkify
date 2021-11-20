require("dotenv").config();

import { scrapeReviews } from "../pages/api/scrape-pitchfork";

const PAGE_COUNT = 2010;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  for (let i = 367; i < PAGE_COUNT; i++) {
    await scrapeReviews(i);
    await sleep(5 * 1000);
  }
}

run();
