import type { NextApiRequest, NextApiResponse } from "next";
import cheerio, { CheerioAPI, Element } from "cheerio";
import fetch from "isomorphic-fetch";
import SpotifyWebApi from "spotify-web-api-node";

import prisma from "../../utils/primsa";
import { sleep } from "../../utils/sleep";
import { Prisma } from "@prisma/client";
import { PitchforkReview } from "./Pitchfork";

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
  review: PitchforkReview
): Promise<ParsedReview> {
  const $reviewPageEl = await getPage(`${rootUrl}${review.url}`);

  let reviewHtml =
    $reviewPageEl('[data-testid="BodyWrapper"]').first().html() ||
    $reviewPageEl(".review-detail__article-content").first().html();

  if (!reviewHtml) {
    console.log("Throttled by Pitchfork. Waiting...");
    await sleep(30 * 1000);
    return parseReview($reviewPage, review);
  }

  if ($reviewPageEl('[data-testid="BodyWrapper"]').length) {
    reviewHtml = `
      <div class="review-detail__abstract">${$reviewPageEl(
        "[class*=SplitScreenContentHeaderDekDown]"
      ).text()}</div>
      <div class="contents dropcap">${reviewHtml}</div>
    `;
  }

  const albumTitle = review.seoTitle;
  const artists = review.artists.map((artist) => ({
    name: artist.display_name,
  }));
  const albums = await searchAlbums(artists[0]?.name, albumTitle);

  return {
    albumTitle,
    cover: review.tombstone.albums[0].album.photos.tout.sizes.standard,
    spotifyAlbum: albums[0]?.uri || null,
    score: Number(review.tombstone.albums[0].rating.rating),
    author: review.authors[0].name.trim(),
    publishDate: new Date(review.pubDate),
    isBestNew: review.tombstone.albums[0].rating.bnm,
    labels: review.tombstone.albums[0].labels_and_years[0].labels.map(
      (label) => ({ name: label.display_name })
    ),
    artists,
    genres: review.genres.map((genre) => ({ name: genre.display_name })),
    reviewHtml,
  };
}

export async function scrapeReviews(page: number) {
  await setupSpotifyApi();

  const $ = await getPage(getReviewPageUrl(page));
  const [, appString] = $.html()
    .toString()
    .match(/<script>window\.App=(.*?);<\/script>/);

  const app = JSON.parse(appString);

  const order = app.context.dispatcher.stores.ReviewsStore.itemPages;
  const reviewsData = (
    Object.values(
      app.context.dispatcher.stores.ReviewsStore.items
    ) as PitchforkReview[]
  ).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const reviews = await Promise.all(
    reviewsData.map((review) => parseReview($, review))
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
