require("dotenv").config();

import { scrapeReviews } from "../pages/api/scrape-pitchfork";

const PAGE_COUNT = 2010;

async function run() {
  for (let i = 1451; i < PAGE_COUNT; i++) {
    await scrapeReviews(i);
  }
}

run();
