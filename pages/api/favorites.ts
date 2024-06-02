import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../utils/primsa";

export async function getAllFavoritesUrisForSession(userId: string) {
  const data = await prisma.savedAlbum.findMany({
    where: { userId },
  });

  return data.map((savedAlbum) => savedAlbum.uri);
}

export default async function favorites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(403).send(false);
  }

  if (req.method === "GET") {
    const uris = await getAllFavoritesUrisForSession(userId);

    return res.status(200).json(uris);
  } else if (req.method === "DELETE") {
    const { uri } = JSON.parse(req.body);

    await prisma.savedAlbum.delete({
      where: { uri_userId: { userId, uri } },
    });

    return res.status(200).json(uri);
  } else if (req.method === "PUT") {
    const { uri } = JSON.parse(req.body);

    await prisma.savedAlbum.upsert({
      where: { uri_userId: { userId, uri } },
      create: { userId, uri },
      update: {},
    });

    return res.status(200).json(uri);
  }

  res.status(404).json(false);
}
