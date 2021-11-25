import { NextApiRequest } from "next";
import { GridFilters } from "../components/GridFilter";
import prisma from "./primsa";

export type GridFilterParams = Omit<Partial<GridFilters>, "search"> & {
  artists?: number[];
  labels?: number[];
};

export function parseGridFilterQuery(
  query: NextApiRequest["query"]
): GridFilterParams {
  return {
    genre: query.genre
      ? decodeURIComponent(query.genre as string).split(",")
      : undefined,
    artists: query.artists
      ? decodeURIComponent(query.artists as string)
          .split(",")
          .map(Number)
      : undefined,
    labels: query.labels
      ? decodeURIComponent(query.labels as string)
          .split(",")
          .map(Number)
      : undefined,
    isBestNew: query.isBestNew === "1" ? true : undefined,
    yearRange: query.yearStart
      ? {
          start: Number(query.yearStart),
          end: Number(query.yearEnd),
        }
      : undefined,
    score: query.scoreStart
      ? {
          start: Number(query.scoreStart),
          end: Number(query.scoreEnd),
        }
      : undefined,
  };
}

export function buildGridFilterWhere(params: GridFilterParams) {
  const query: Parameters<typeof prisma.review.findMany>[0] = {};

  if (params.genre) {
    query.where = {
      ...query.where,
      genres: {
        some: {
          name: {
            in: params.genre,
          },
        },
      },
    };
  }

  if (params.isBestNew) {
    query.where = {
      ...query.where,
      isBestNew: true,
    };
  }

  if (params.yearRange) {
    query.where = {
      ...query.where,
      publishDate: {
        gt: new Date(String(params.yearRange.start)),
        lte: new Date(String(Number(params.yearRange.end) + 1)),
      },
    };
  }

  if (params.score) {
    query.where = {
      ...query.where,
      score: {
        gte: params.score.start,
        lte: params.score.end,
      },
    };
  }

  if (params.artists) {
    query.where = {
      ...query.where,
      artists: {
        some: {
          id: {
            in: params.artists,
          },
        },
      },
    };
  }

  if (params.labels) {
    query.where = {
      ...query.where,
      labels: {
        some: {
          id: {
            in: params.labels,
          },
        },
      },
    };
  }

  return query.where;
}
