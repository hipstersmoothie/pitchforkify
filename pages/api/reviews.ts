import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../utils/primsa";

export function getReviews() {
  return prisma.review.findMany({
    orderBy: { publishDate: "desc" },
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
  });
}

export default async function reviews(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reviews = await getReviews();
  res.status(200).json(reviews);
}
