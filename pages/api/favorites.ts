import type { NextApiRequest, NextApiResponse } from "next";
import { PAGE_SIZE } from "../../utils/constants";
import prisma from "../../utils/primsa";

interface GetFavoritesOptions {
  cursor?: number;
  favorites: string[];
}

export async function getFavorites(options: GetFavoritesOptions) {
  const findOptions: Parameters<typeof prisma.review.findMany>[0] = {
    take: PAGE_SIZE,
  };

  if (options.cursor) {
    findOptions.skip = 1;
    findOptions.cursor = {
      id: options.cursor,
    };
  }

  return await prisma.review
    .findMany({
      ...findOptions,
      orderBy: [{ id: "desc" }],
      where: {
        spotifyAlbum: {
          in: options.favorites,
        },
      },
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

export default async function favorites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reviews = await getFavorites({
    favorites: JSON.parse(req.body),
    cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
  });

  res.status(200).json(reviews);
}
