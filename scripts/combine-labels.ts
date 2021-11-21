import prisma from "../utils/primsa";
import { chunkPromise, PromiseFlavor } from "chunk-promise";

async function run() {
  let artists = await prisma.artist.findMany();

  while (artists.length) {
    const artist = artists.shift();
    const artistStillExists = await prisma.artist.findFirst({
      where: { id: artist.id },
    });

    if (!artistStillExists) {
      console.log("Already combined", { artist });
      continue;
    }

    const duplicates = await prisma.artist.findMany({
      where: { name: artist.name, id: { not: artist.id } },
    });

    console.log("Combining duplicates of:", {
      artist,
      duplicates: duplicates.length,
    });

    artists = artists.filter((a) => !duplicates.some((d) => d.id === a.id));

    await chunkPromise(
      duplicates.map((duplicate) => async () => {
        const artistOnReview = await prisma.artistOnReview.findFirst({
          where: { artistId: duplicate.id },
        });

        if (artistOnReview) {
          try {
            await prisma.artistOnReview.update({
              where: {
                reviewId_artistId: {
                  reviewId: artistOnReview.reviewId,
                  artistId: artistOnReview.artistId,
                },
              },
              data: {
                artistId: artist.id,
              },
            });
          } catch (error) {
            if (error.code === "P2002") {
              await prisma.artistOnReview.delete({
                where: {
                  reviewId_artistId: {
                    reviewId: artistOnReview.reviewId,
                    artistId: artistOnReview.artistId,
                  },
                },
              });
            } else {
              throw error;
            }
          }
        } else {
          console.log('ARTIST HAD NO REVIEW ATTACHED')
        }

        await prisma.artist.delete({
          where: { id: duplicate.id },
        });
        console.log("deleted", { duplicate });
      }),
      {
        concurrent: 500,
        promiseFlavor: PromiseFlavor.PromiseAll,
      }
    );
  }
}

run();
