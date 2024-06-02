import type { NextApiRequest, NextApiResponse } from "next";
import SpotifyWebApi from "spotify-web-api-node";
import { chunkPromise, PromiseFlavor } from "chunk-promise";
import { clerkClient, getAuth } from "@clerk/nextjs/server";

import prisma from "../../utils/primsa";
import { sleep } from "../../utils/sleep";

export async function pullFavorites(userId: string) {
  const tokenData = await clerkClient.users.getUserOauthAccessToken(
    userId,
    "oauth_spotify"
  );

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    accessToken: tokenData.data[0].token,
  });

  let user = await prisma.user.findFirst({ where: { id: userId } });

  if (!user) {
    user = await prisma.user.create({ data: { id: userId } });
  }

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
          (item) => item.album.uri === user?.lastSavedAlbum
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

  await chunkPromise(
    [...new Set(uris)].map((uri) => () => {
      console.log("Adding favorite", uri);
      return prisma.savedAlbum.upsert({
        where: {
          uri_userId: { userId, uri },
        },
        create: {
          userId,
          uri,
        },
        update: {},
      });
    }),
    {
      concurrent: 10,
      promiseFlavor: PromiseFlavor.PromiseAll,
    }
  );

  if (uris[0]) {
    await prisma.user.update({
      where: {
        id: userId,
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
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(403).send(false);
  }

  await pullFavorites(userId);

  res.status(200).send(true);
}
