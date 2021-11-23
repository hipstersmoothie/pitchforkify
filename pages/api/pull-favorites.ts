import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import SpotifyWebApi from "spotify-web-api-node";
import { chunkPromise, PromiseFlavor } from "chunk-promise";

import prisma from "../../utils/primsa";
import { sleep } from "../../utils/sleep";

export async function pullFavorites(token: string, providerAccountId: string) {
  console.log("Pulling favorites...");
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    accessToken: token,
  });

  const { lastSavedAlbum } = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "spotify",
        providerAccountId: providerAccountId,
      },
    },
    select: {
      lastSavedAlbum: true,
    },
  });

  console.log({ lastSavedAlbum });

  async function getNewSavedAlbums() {
    let albums: SpotifyApi.SavedAlbumObject[] = [];
    let offset = 0;

    while (true) {
      try {
        let {
          body: { items },
        } = await spotifyApi.getMySavedAlbums({
          limit: 50,
          offset,
        });

        const lastSavedIndex = items.findIndex(
          (item) => item.album.uri === lastSavedAlbum
        );
        const hasLastSaved = lastSavedIndex !== -1;

        if (hasLastSaved) {
          items = items.slice(0, lastSavedIndex);
        }

        offset += items.length - 1;
        albums = [...albums, ...items];

        if (items.length !== 50 || hasLastSaved) {
          break;
        }
      } catch (error) {
        if (
          error.code === "ECONNRESET" ||
          error.statusCode === 500 ||
          error.statusCode === 429
        ) {
          console.log("Errors with spotify. Waiting...");

          if (error.statusCode === 429) {
            await sleep(Number(error.headers["retry-after"]) * 1000);
          } else {
            await sleep(30 * 1000);
          }
        } else {
          console.log(error.code);
          console.log(error);
          throw error;
        }
      }
    }

    return albums;
  }

  const favoriteAlbums = await getNewSavedAlbums();
  const uris = favoriteAlbums.map((album) => album.album.uri);

  console.log("New Favorites", { uris });

  await chunkPromise(
    [...new Set(uris)].map((uri) => () => {
      console.log("Adding favorite", uri);
      return prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: "spotify",
            providerAccountId: providerAccountId,
          },
        },
        data: {
          savedAlbums: {
            connectOrCreate: [
              {
                where: { uri },
                create: { uri },
              },
            ],
          },
        },
      });
    }),
    {
      concurrent: 10,
      promiseFlavor: PromiseFlavor.PromiseAll,
    }
  );

  if (uris[0]) {
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: "spotify",
          providerAccountId: providerAccountId,
        },
      },
      data: {
        lastSavedAlbum: uris[0],
      },
    });
  }
}

export default async function pullFavoritesEndpoint(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(403).send(false);
  }

  await pullFavorites(
    session.accessToken as string,
    session.providerAccountId as string
  );

  res.status(200).send(true);
}
