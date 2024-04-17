import prisma from "../utils/primsa";

require("dotenv").config();

import { scrapeReviews } from "../pages/api/scrape-pitchfork";
import pRetry from "p-retry";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const startPage = 1;

  for (let i = startPage; i >= 0; i--) {
    console.log(`Scraping ${i}`);
    await pRetry(() => scrapeReviews(i), {
      retries: 3,
      onFailedAttempt: (error) => {
        console.log(error);
      },
    });
    await sleep(1000);
  }
}

run();

// async function run() {
//   const allReviews = await prisma.review.findMany();

//   // delete allReviews;
//   await prisma.review.deleteMany({
//     where: {
//       id: {
//         in: allReviews.map((r) => r.id),
//       },
//     },
//   });
// }

// run();
