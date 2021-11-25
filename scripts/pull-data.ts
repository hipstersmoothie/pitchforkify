import path from "path";
import { promises as fs } from "fs";

import prisma from "../utils/primsa";

const publicDir = path.join(__dirname, "../public");

async function run() {
  const genres = await prisma.genre.findMany();

  await fs.writeFile(
    path.join(publicDir, "genres.json"),
    JSON.stringify(genres.map((g) => g.name))
  );

  const labels = await prisma.label.findMany();

  await fs.writeFile(
    path.join(publicDir, "labels.json"),
    JSON.stringify(labels)
  );
  const artists = await prisma.artist.findMany();

  await fs.writeFile(
    path.join(publicDir, "artists.json"),
    JSON.stringify(artists)
  );
}

run();
