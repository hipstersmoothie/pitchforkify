import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../utils/primsa";

export function getReviews(page: number) {
  return prisma.review.findMany({
    orderBy: [{ publishDate: "desc" }],
    select: {
      albumTitle: true,
      reviewHtml: true,
      cover: true,
      spotifyAlbum: true,
      score: true,
      publishDate: true,
      isBestNew: true,
      labels: { include: { label: true } },
      genres: { include: { genre: true } },
      artists: { include: { artist: true } },
    },
    take: 12,
    skip: 12 * (page - 1),
  });
}

export type Review = Awaited<ReturnType<typeof getReviews>>[number];

export default async function reviews(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reviews = await getReviews(req.query.page ? Number(req.query.page) : 1);
  res.status(200).json(reviews);
}
