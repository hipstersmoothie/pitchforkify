import type { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";

import prisma from "../../utils/primsa";

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

export default async function favorites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (req.method === "GET") {
    const uris = await getAllFavoritesUrisForSession(session);

    return res.status(200).json(uris);
  } else if (req.method === "DELETE") {
    const { uri } = JSON.parse(req.body);

    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: "spotify",
          providerAccountId: session.providerAccountId as string,
        },
      },
      data: {
        savedAlbums: {
          delete: {
            uri,
          },
        },
      },
    });

    return res.status(200).json(uri);
  } else if (req.method === "PUT") {
    const { uri } = JSON.parse(req.body);

    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: "spotify",
          providerAccountId: session.providerAccountId as string,
        },
      },
      data: {
        savedAlbums: {
          connectOrCreate: {
            where: { uri },
            create: { uri },
          },
        },
      },
    });

    return res.status(200).json(uri);
  }

  res.status(404).json(false);
}
