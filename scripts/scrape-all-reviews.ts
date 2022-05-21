require("dotenv").config();

import { scrapeReviews } from "../pages/api/scrape-pitchfork";

async function run() {
  for (let i = 34; i >= 1; i--) {
    await scrapeReviews(i);
  }
}

run();
