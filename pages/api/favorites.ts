import type { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
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

export async function getAllFavoritesUrisForSession(session: Session) {
  const { savedAlbums } = await prisma.account.findFirst({
    where: {
      providerAccountId: session.providerAccountId as string,
    },
    select: {
      savedAlbums: true,
    },
  });

  return savedAlbums.map((savedAlbum) => savedAlbum.uri);
}

export async function getFavoritesForSession(
  session: Session,
  cursor?: number
) {
  const favorites = await getAllFavoritesUrisForSession(session);
  return await getFavorites({ favorites, cursor });
}

export default async function favorites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  const reviews = await getFavoritesForSession(
    session,
    req.query.cursor ? Number(req.query.cursor) : undefined
  );

  res.status(200).json(reviews);
}
