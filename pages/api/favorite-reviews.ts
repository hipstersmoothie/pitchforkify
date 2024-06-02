import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { PAGE_SIZE } from "../../utils/constants";
import {
  buildGridFilterWhere,
  GridFilterParams,
  parseGridFilterQuery,
} from "../../utils/gridFilterQuery";
import prisma from "../../utils/primsa";
import { getAllFavoritesUrisForSession } from "./favorites";

type GetFavoriteReviewsOptions = GridFilterParams & {
  cursor?: number;
  favorites: string[];
};

async function getFavoriteReviews(options: GetFavoriteReviewsOptions) {
  const findOptions: Parameters<typeof prisma.review.findMany>[0] = {
    take: PAGE_SIZE,
    where: buildGridFilterWhere(options),
  };

  findOptions.where = {
    ...findOptions.where,
    spotifyAlbum: {
      in: options.favorites,
    },
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

export default async function favoriteReviews(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(403).send(false);
  }

  const favorites = await getAllFavoritesUrisForSession(userId);
  const reviews = await getFavoriteReviews({
    favorites,
    cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
    ...parseGridFilterQuery(req.query),
  });

  res.status(200).json(reviews);
}
