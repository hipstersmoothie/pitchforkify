import type { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";

import prisma from "../../utils/primsa";

export async function getAllPlayedUrisForSession(session: Session) {
  const { playedAlbums } = await prisma.account.findFirst({
    where: {
      providerAccountId: session.providerAccountId as string,
    },
    select: {
      playedAlbums: true,
    },
  });

  return playedAlbums.map((savedAlbum) => savedAlbum.uri);
}

export default async function played(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (req.method === "GET") {
    if (!session) {
      return res.status(200).json([]);
    }

    const uris = await getAllPlayedUrisForSession(session);

    return res.status(200).json(uris);
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
        playedAlbums: {
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
