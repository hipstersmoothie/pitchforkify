import type { NextApiRequest, NextApiResponse } from "next";
import cheerio, { CheerioAPI, Element } from "cheerio";
import fetch from "isomorphic-fetch";
import SpotifyWebApi from "spotify-web-api-node";

import prisma from "../../utils/primsa";
import { sleep } from "../../utils/sleep";
import { Prisma } from "@prisma/client";

const rootUrl = "https://pitchfork.com";

let spotifyApi: SpotifyWebApi;

async function setupSpotifyApi() {
  spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const token = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(token.body["access_token"]);
}

function getReviewPageUrl(page: number) {
  return `${rootUrl}/reviews/albums/?page=${page}`;
}

async function getPage(url: string) {
  const response = await fetch(url);
  const html = await response.text();

  return cheerio.load(html);
}

async function searchAlbums(artist: string, album: string) {
  try {
    const {
      body: {
        albums: { items },
      },
    } = await spotifyApi.search(`${artist} ${album.replace("EP", "")}`, [
      "album",
    ]);

    return items;
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

      return searchAlbums(artist, album);
    }

    console.log(error.code);
    console.log(error);
    throw error;
  }
}

interface ParsedReview {
  albumTitle: string;
  cover: string;
  spotifyAlbum: string;
  score: number;
  author: string;
  publishDate: Date;
  isBestNew: boolean;
  labels: { name: string }[];
  artists: { name: string }[];
  genres: { name: string }[];
  reviewHtml: string;
}

async function parseReview(
  $reviewPage: CheerioAPI,
  reviewEl: Element
): Promise<ParsedReview> {
  const $reviewPageEl = await getPage(
    `${rootUrl}${$reviewPage(".review__link", reviewEl).attr("href")}`
  );
  const reviewHtml = $reviewPageEl(".review-detail__article-content")
    .first()
    .html();

  if (!reviewHtml) {
    console.log("Throttled by Pitchfork. Waiting...");
    await sleep(30 * 1000);
    return parseReview($reviewPage, reviewEl);
  }

  const albumTitle = $reviewPage(".review__title-album", reviewEl).text();
  const artists = $reviewPage(".review__title-artist li", reviewEl)
    .toArray()
    .map((artist) => ({ name: $reviewPage(artist).text() }));
  const albums = await searchAlbums(artists[0].name, albumTitle);

  return {
    albumTitle: $reviewPage(".review__title-album", reviewEl).text(),
    cover: $reviewPage(".review__artwork img", reviewEl).attr("src"),
    spotifyAlbum: albums[0]?.uri || null,
    score: Number($reviewPageEl(".score").first().text()),
    author: $reviewPage(".display-name--linked", reviewEl)
      .text()
      .replace("by: ", ""),
    publishDate: new Date($reviewPage(".pub-date", reviewEl).attr("datetime")),
    isBestNew: $reviewPage(".review__artwork--with-notch", reviewEl).length > 0,
    labels: $reviewPageEl(".labels-list__item")
      .first()
      .toArray()
      .map((label) => ({ name: $reviewPage(label).text() })),
    artists,
    genres: $reviewPage(".genre-list__item", reviewEl)
      .first()
      .toArray()
      .map((genre) => ({ name: $reviewPage(genre).text() })),
    reviewHtml,
  };
}

export async function scrapeReviews(page: number) {
  console.log({ page });
  await setupSpotifyApi();

  const $ = await getPage(getReviewPageUrl(page));
  const reviewsHtml = $(".review");
  const reviews = await Promise.all(
    reviewsHtml.toArray().map((review) => parseReview($, review))
  );

  // : Prisma.ReviewCreateArgs["data"]
  const reviewCreations = reviews.reverse().map((r) => ({
    ...r,
    labels: {
      connectOrCreate: r.labels.map((l) => ({ where: l, create: l })),
    },
    artists: {
      connectOrCreate: r.artists.map((a) => ({ where: a, create: a })),
    },
    genres: {
      connectOrCreate: r.genres.map((g) => ({ where: g, create: g })),
    },
  }));

  for (const data of reviewCreations) {
    const review = await prisma.review.findFirst({
      where: {
        albumTitle: data.albumTitle,
        author: data.author,
        score: data.score,
      },
      select: {
        id: true,
        spotifyAlbum: true,
      },
    });

    if (!review) {
      console.log(
        `Added: "${data.albumTitle}" by ${data.artists.connectOrCreate
          .map((a) => a.create.name)
          .join(", ")}`,
        { hasSpotify: Boolean(data.spotifyAlbum) }
      );
      try {
        await prisma.review.create({
          data,
        });
      } catch (error) {
        delete data.reviewHtml;
        console.log(JSON.stringify(data, null, 2));
        throw error;
      }
    } else if (!review.spotifyAlbum && data.spotifyAlbum) {
      console.log(
        `Updated: "${data.albumTitle}" by ${data.artists.connectOrCreate
          .map((a) => a.create.name)
          .join(", ")}`
      );
      await prisma.review.update({
        where: {
          id: review.id,
        },
        data: {
          spotifyAlbum: data.spotifyAlbum,
        },
      });
    }
  }
}

export default async function scrapePitchfork(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await scrapeReviews(1);
  res.status(200).json(true);
}
