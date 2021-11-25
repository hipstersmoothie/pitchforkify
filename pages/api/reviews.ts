import type { NextApiRequest, NextApiResponse } from "next";
import { GridFilters } from "../../components/GridFilter";
import { PAGE_SIZE } from "../../utils/constants";
import prisma from "../../utils/primsa";

type GetReviewsOptions = Omit<Partial<GridFilters>, "search"> & {
  artists?: number[];
  labels?: number[];
} & (
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
  };

  if ("cursor" in options && options.cursor) {
    findOptions.skip = 1;
    findOptions.cursor = {
      id: options.cursor,
    };
  } else if ("page" in options && options.page) {
    findOptions.skip = PAGE_SIZE * (options.page - 1);
  }

  if (options.genre) {
    findOptions.where = {
      ...findOptions.where,
      genres: {
        some: {
          name: {
            in: options.genre,
          },
        },
      },
    };
  }

  if (options.isBestNew) {
    findOptions.where = {
      ...findOptions.where,
      isBestNew: true,
    };
  }

  if (options.yearRange) {
    findOptions.where = {
      ...findOptions.where,
      publishDate: {
        gt: new Date(String(options.yearRange.start)),
        lte: new Date(String(Number(options.yearRange.end) + 1)),
      },
    };
  }

  if (options.score) {
    findOptions.where = {
      ...findOptions.where,
      score: {
        gte: options.score.start,
        lte: options.score.end,
      },
    };
  }

  if (options.artists) {
    findOptions.where = {
      ...findOptions.where,
      artists: {
        some: {
          id: {
            in: options.artists,
          },
        },
      },
    };
  }

  if (options.labels) {
    findOptions.where = {
      ...findOptions.where,
      labels: {
        some: {
          id: {
            in: options.labels,
          },
        },
      },
    };
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

export type Review = Awaited<ReturnType<typeof getReviews>>[number];

export default async function reviews(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reviews = await getReviews({
    genre: req.query.genre
      ? decodeURIComponent(req.query.genre as string).split(",")
      : undefined,
    artists: req.query.artists
      ? decodeURIComponent(req.query.artists as string)
          .split(",")
          .map(Number)
      : undefined,
    labels: req.query.labels
      ? decodeURIComponent(req.query.labels as string)
          .split(",")
          .map(Number)
      : undefined,
    isBestNew: req.query.isBestNew === "1" ? true : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
    yearRange: req.query.yearStart
      ? {
          start: Number(req.query.yearStart),
          end: Number(req.query.yearEnd),
        }
      : undefined,
    score: req.query.scoreStart
      ? {
          start: Number(req.query.scoreStart),
          end: Number(req.query.scoreEnd),
        }
      : undefined,
  });

  res.status(200).json(reviews);
}
