import type { NextApiRequest, NextApiResponse } from "next";
import cheerio, { CheerioAPI } from "cheerio";
import fetch from "isomorphic-fetch";
import SpotifyWebApi from "spotify-web-api-node";

import prisma from "../../utils/primsa";
import { sleep } from "../../utils/sleep";
import { PitchforkReview } from "./Pitchfork";
import pRetry from "p-retry";
import PQueue from "p-queue";

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
    console.log(error);
    if (
      error.code === "ETIMEDOUT" ||
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
  review: PitchforkReview
): Promise<ParsedReview> {
  const $reviewPageEl = await pRetry(() => getPage(`${rootUrl}${review.url}`), {
    retries: 3,
    onFailedAttempt: (error) => {
      console.log(error);
    },
  });

  const albumTitle = review.image.altText;
  console.log({ albumTitle });
  let blurb = $reviewPageEl('[class*="SplitScreenContentHeaderDekDown"]')
    .first()
    ?.html()
    ?.toString();
  let reviewHtml = [
    blurb ? `<div class="review-blurb">${blurb}</div>` : "",
    ...$reviewPageEl('[data-testid="BodyWrapper"]')
      .map((i, el) => $reviewPageEl(el).html().toString())
      .toArray(),
  ]
    .filter(Boolean)
    .join("\n");

  if (!reviewHtml) {
    console.log("Throttled by Pitchfork. Waiting...", review);
    await sleep(60 * 1000);
    return parseReview($reviewPage, review);
  }

  const artists =
    review.subHed?.name.split("\u002F").map((item) => item.trim()) || [];
  const albums = await searchAlbums(artists[0], albumTitle);
  const labelLabel = $reviewPageEl("*")
    .toArray()
    .filter((el) => $reviewPageEl(el).text() === "Label:")[0];
  const labels = labelLabel
    ? $reviewPageEl(labelLabel.nextSibling)
        .text()
        .split("/")
        .map((item) => ({
          name: item.trim(),
        }))
    : [];
  const genreLabel = $reviewPageEl("*")
    .toArray()
    .filter((el) => $reviewPageEl(el).text() === "Genre:")[0];
  const genres = genreLabel
    ? $reviewPageEl(genreLabel.nextSibling)
        .text()
        .split("/")
        .map((item) => ({
          name: item.trim(),
        }))
    : [];

  return {
    albumTitle,
    labels,
    cover: review.image.sources.lg.url,
    spotifyAlbum: albums[0]?.uri || null,
    score: review.ratingValue.score || 0,
    author: review.contributors.author?.items[0].name.trim() || "",
    publishDate: new Date(review.pubDate),
    isBestNew: review.ratingValue.isBestNewMusic,
    artists: artists.map((artist) => ({ name: artist })),
    genres,
    reviewHtml,
  };
}

export async function scrapeReviews(page: number) {
  await setupSpotifyApi();

  const $ = await pRetry(() => getPage(getReviewPageUrl(page)), {
    retries: 3,
    onFailedAttempt: (error) => {
      console.log(error);
    },
  });
  let [, appString] = $.html()
    .toString()
    .match(/window\.__PRELOADED_STATE__ = ([\s\S]*?};)/m);

  appString = appString.replace(/;$/, "");

  const reviewsData = JSON.parse(
    appString
  ).transformed.bundle.containers[0].items.filter(
    (r) =>
      ![
        "/reviews/albums/1365-no-more-shall-we-part/",
        "/reviews/albums/5911-the-complete-studio-recordings/",
      ].includes(r.url)
  );
  const reviews: ParsedReview[] = [];
  const queue = new PQueue({ concurrency: 8 });

  for (const review of reviewsData) {
    queue.add(async () => {
      const parsedReview = await parseReview($, review);
      reviews.push(parsedReview);
    });
  }

  await queue.onIdle();

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
    });

    if (!review) {
      try {
        await prisma.review.create({
          data,
        });
        console.log(
          `Added: "${data.albumTitle}" by ${data.artists.connectOrCreate
            .map((a) => a.create.name)
            .join(", ")}`,
          { hasSpotify: Boolean(data.spotifyAlbum) }
        );
      } catch (error) {
        delete data.reviewHtml;
        console.log(error);
        console.log(JSON.stringify(data, null, 2));
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
