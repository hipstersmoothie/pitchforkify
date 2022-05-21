import { getReviews } from "../pages/api/reviews";
import prisma from "../utils/primsa";

async function cleanUpPage(page: number) {
  console.log("cleaning up page", page);
  const reviews = await getReviews({
    page,
  });

  for (const review of reviews) {
    await prisma.review.delete({
      where: { id: review.id },
    });
  }
}

async function cleanUp() {
  for (let i = 1; i <= 1; i++) {
    await cleanUpPage(i);
  }
}

void cleanUp();
