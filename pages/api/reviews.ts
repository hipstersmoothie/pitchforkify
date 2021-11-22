import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../utils/primsa";

type GetReviewsOptions =
  | {
      cursor: number;
    }
  | {
      page: number;
    };

export function getReviews(options: GetReviewsOptions) {
  const findOptions: Parameters<typeof prisma.review.findMany>[0] = {};

  if ("cursor" in options && options.cursor) {
    findOptions.skip = 1;
    findOptions.cursor = {
      id: options.cursor,
    };
  } else if ("page" in options && options.page) {
    findOptions.skip = 12 * (options.page - 1);
  }

  return prisma.review
    .findMany({
      ...findOptions,
      orderBy: [{ createdAt: "desc" }],
      take: 12,
      include: {
        labels: true,
        artists: true,
        genres: true,
      },
    })
    .then((reviews) =>
      reviews.map((r) => ({
        ...r,
        publishDate: r.publishDate.toUTCString(),
        createdAt: r.createdAt.toUTCString(),
        updatedAt: r.updatedAt.toUTCString(),
      }))
    );
}

export type Review = Awaited<ReturnType<typeof getReviews>>[number];

export default async function reviews(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reviews = await getReviews({
    page: req.query.page ? Number(req.query.page) : undefined,
    cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
  });
  res.status(200).json(reviews);
}
