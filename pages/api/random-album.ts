import { Review } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../utils/primsa";

export default async function random(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const [randomAlbum] =
    (await prisma.$queryRaw`SELECT * FROM Review ORDER BY RAND() LIMIT 1;`) as Review[];
  const review = await prisma.review.findUnique({
    where: { id: randomAlbum.id },
    include: {
      labels: true,
      artists: true,
      genres: true,
    },
  });

  res.status(200).json({
    ...review,
    publishDate: review.publishDate.toUTCString(),
    createdAt: review.createdAt.toUTCString(),
    updatedAt: review.updatedAt.toUTCString(),
  });
}
