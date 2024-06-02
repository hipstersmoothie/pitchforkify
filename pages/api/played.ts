import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../utils/primsa";

async function getAllPlayedUrisForSession(userId: string) {
  const res = await prisma.playedAlbum.findMany({
    where: { userId },
  });

  return res?.map((savedAlbum) => savedAlbum.uri) || [];
}

export default async function played(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(403).send(false);
  }

  if (req.method === "GET") {
    const uris = await getAllPlayedUrisForSession(userId);

    return res.status(200).json(uris);
  } else if (req.method === "PUT") {
    const { uri } = JSON.parse(req.body);

    await prisma.playedAlbum.upsert({
      where: { uri_userId: { uri, userId } },
      create: { userId, uri },
      update: {},
    });

    return res.status(200).json(uri);
  }

  res.status(404).json(false);
}
