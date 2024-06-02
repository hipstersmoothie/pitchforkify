import { Artist, Genre, Label } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

import { PAGE_SIZE } from "../../utils/constants";
import {
  buildGridFilterWhere,
  GridFilterParams,
  parseGridFilterQuery,
} from "../../utils/gridFilterQuery";
import prisma from "../../utils/primsa";

type GetReviewsOptions = GridFilterParams &
  (
    | {
        cursor: number;
      }
    | {
        page: number;
      }
  );

export function getReviews(options: GetReviewsOptions) {
  const findOptions: Parameters<typeof prisma.review.findMany>[0] = {
    take: PAGE_SIZE,
    where: buildGridFilterWhere(options),
  };

  if ("cursor" in options && options.cursor) {
    findOptions.skip = 1;
    findOptions.cursor = {
      id: options.cursor,
    };
  } else if ("page" in options && options.page) {
    findOptions.skip = PAGE_SIZE * (options.page - 1);
  }

  return prisma.review
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

export type Review = Awaited<ReturnType<typeof getReviews>>[number] & {
  genres: Genre[];
  artists: Artist[];
  labels: Label[];
};

export default async function reviews(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reviews = await getReviews({
    ...parseGridFilterQuery(req.query),
    page: req.query.page ? Number(req.query.page) : 1,
    cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
  });

  res.status(200).json(reviews);
}
