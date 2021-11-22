require("dotenv").config();

import { scrapeReviews } from "../pages/api/scrape-pitchfork";

const PAGE_COUNT = 2010;

async function run() {
  for (let i = 1356; i >= 1; i--) {
    await scrapeReviews(i);
  }
}

run();
